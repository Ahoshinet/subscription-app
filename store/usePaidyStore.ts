import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { fetchPaidyTransactions, GmailAuthError, PaidyTransaction } from '@/lib/gmail';
import { ApiError, gmailApi } from '@/lib/api';
import { captureAuthSession, isAuthSessionCurrent } from '@/lib/authSession';

const LEGACY_GMAIL_TOKEN_KEY = 'paidy_gmail_access_token';
const PAIDY_STORAGE_KEY = 'paidy-store';
const knownGmailTokenKeys = new Set<string>();

function gmailTokenKey(userId: string): string {
  const key = `${LEGACY_GMAIL_TOKEN_KEY}:${userId}`;
  knownGmailTokenKeys.add(key);
  return key;
}

interface PaidyState {
  isSignedIn: boolean;
  /** Gmail access token is missing/expired — the user must re-run the Google auth prompt. */
  needsReauth: boolean;
  /** Server-side integration delete failed (e.g. offline); retried on next loadFromServer. */
  pendingServerDeletion: boolean;
  googleEmail: string | null;
  paidyAmount: number | null;
  paidyMonth: string | null;
  nextPaymentDate: string | null;
  transactions: PaidyTransaction[];
  lastSyncedAt: string | null;
  isLoading: boolean;
  error: string | null;

  loadFromServer: () => Promise<void>;
  setSignedIn: (accessToken: string, email: string) => Promise<void>;
  syncPaidy: () => Promise<void>;
  signOut: () => Promise<void>;
  resetForLogout: () => Promise<void>;
  clearError: () => void;
}

export const usePaidyStore = create<PaidyState>()(
  persist(
    (set, get) => ({
      isSignedIn: false,
      needsReauth: false,
      pendingServerDeletion: false,
      googleEmail: null,
      paidyAmount: null,
      paidyMonth: null,
      nextPaymentDate: null,
      transactions: [],
      lastSyncedAt: null,
      isLoading: false,
      error: null,

      loadFromServer: async () => {
        const session = captureAuthSession();
        if (!session) return;
        // 前回の連携解除がサーバーに届いていなければ、再取得より先に削除を再試行する。
        // ここで getIntegration してしまうと解除したはずの連携が復活する。
        if (get().pendingServerDeletion) {
          try {
            await gmailApi.deleteIntegration();
            if (isAuthSessionCurrent(session)) set({ pendingServerDeletion: false });
          } catch (err: any) {
            if (err instanceof ApiError && err.status === 404) {
              // レコードは既に無い = 削除完了扱い
              if (isAuthSessionCurrent(session)) set({ pendingServerDeletion: false });
            }
            // それ以外は次回起動時に再試行
          }
          return;
        }
        try {
          const data = await gmailApi.getIntegration();
          // この端末に Gmail トークンが無い場合（機種変更など）は再連携が必要
          let hasToken = false;
          try {
            hasToken = (await SecureStore.getItemAsync(gmailTokenKey(session.userId))) != null;
            // A legacy token was not account-scoped and cannot safely be
            // assigned after account switching.
            await SecureStore.deleteItemAsync(LEGACY_GMAIL_TOKEN_KEY);
          } catch { /* SecureStore unavailable */ }
          if (!isAuthSessionCurrent(session)) return;
          set({
            isSignedIn: true,
            needsReauth: !hasToken,
            googleEmail: data.gmail_email,
            paidyAmount: data.paidy_amount,
            paidyMonth: data.paidy_month,
            nextPaymentDate: data.paidy_next_payment_date,
            transactions: data.paidy_transactions ?? [],
            lastSyncedAt: data.last_synced_at,
          });
        } catch {
          // 404 = 未連携、その他エラーは無視してローカル状態を維持
        }
      },

      setSignedIn: async (accessToken: string, email: string) => {
        const session = captureAuthSession();
        if (!session) return;
        const tokenKey = gmailTokenKey(session.userId);
        await SecureStore.setItemAsync(tokenKey, accessToken);
        if (isAuthSessionCurrent(session)) {
          set({ isSignedIn: true, needsReauth: false, googleEmail: email });
        } else {
          await SecureStore.deleteItemAsync(tokenKey).catch(() => {});
        }
      },

      syncPaidy: async () => {
        const session = captureAuthSession();
        if (!session) return;
        set({ isLoading: true, error: null });
        try {
          const token = await SecureStore.getItemAsync(gmailTokenKey(session.userId));
          if (!isAuthSessionCurrent(session)) return;
          if (!token) {
            set({ needsReauth: true, isLoading: false, error: 'Gmailとの再連携が必要です' });
            return;
          }

          const summary = await fetchPaidyTransactions(token);
          if (!isAuthSessionCurrent(session)) return;
          const now = new Date().toISOString();

          if (summary) {
            set({
              paidyAmount: summary.totalAmount,
              paidyMonth: summary.month,
              nextPaymentDate: summary.nextPaymentDate,
              transactions: summary.transactions,
              lastSyncedAt: now,
              isLoading: false,
            });
            if (!isAuthSessionCurrent(session)) return;
            await gmailApi.upsertIntegration({
              gmail_email: get().googleEmail ?? '',
              paidy_amount: summary.totalAmount,
              paidy_month: summary.month,
              paidy_next_payment_date: summary.nextPaymentDate,
              paidy_transactions: summary.transactions,
              last_synced_at: now,
            });
          } else {
            // A valid empty result is not evidence that the previous summary
            // was wrong. Preserve it instead of erasing billing data.
            set({
              lastSyncedAt: now,
              isLoading: false,
            });
          }
        } catch (err: any) {
          if (!isAuthSessionCurrent(session)) return;
          if (err instanceof GmailAuthError) {
            // アクセストークン失効（約1時間）— 再連携を促す
            set({ needsReauth: true, error: 'Gmailとの再連携が必要です', isLoading: false });
            return;
          }
          set({ error: err.message ?? '同期に失敗しました', isLoading: false });
        }
      },

      signOut: async () => {
        const session = captureAuthSession();
        if (!session) return;
        try {
          await SecureStore.deleteItemAsync(gmailTokenKey(session.userId));
        } catch {
          // トークンなし時も状態リセットは行う
        }
        if (!isAuthSessionCurrent(session)) return;
        // サーバー側の連携レコード削除に失敗したら次回 loadFromServer で再試行する。
        // 黙って握りつぶすと次回起動時に連携が復活してしまう。
        let pendingServerDeletion = false;
        try {
          await gmailApi.deleteIntegration();
        } catch (err: any) {
          // 404 = レコードが元々無い（削除済み）ので成功扱い
          if (!(err instanceof ApiError && err.status === 404)) {
            pendingServerDeletion = true;
          }
        }
        if (!isAuthSessionCurrent(session)) return;
        set({
          isSignedIn: false,
          needsReauth: false,
          pendingServerDeletion,
          googleEmail: null,
          paidyAmount: null,
          paidyMonth: null,
          nextPaymentDate: null,
          transactions: [],
          lastSyncedAt: null,
          error: null,
        });
      },

      resetForLogout: async () => {
        await Promise.allSettled([
          SecureStore.deleteItemAsync(LEGACY_GMAIL_TOKEN_KEY),
          ...Array.from(knownGmailTokenKeys, (key) => SecureStore.deleteItemAsync(key)),
        ]);
        set({
          isSignedIn: false,
          needsReauth: false,
          pendingServerDeletion: false,
          googleEmail: null,
          paidyAmount: null,
          paidyMonth: null,
          nextPaymentDate: null,
          transactions: [],
          lastSyncedAt: null,
          isLoading: false,
          error: null,
        });
        await AsyncStorage.removeItem(PAIDY_STORAGE_KEY);
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: PAIDY_STORAGE_KEY,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        isSignedIn: state.isSignedIn,
        needsReauth: state.needsReauth,
        pendingServerDeletion: state.pendingServerDeletion,
        googleEmail: state.googleEmail,
        paidyAmount: state.paidyAmount,
        paidyMonth: state.paidyMonth,
        nextPaymentDate: state.nextPaymentDate,
        transactions: state.transactions,
        lastSyncedAt: state.lastSyncedAt,
      }),
    }
  )
);
