import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { fetchPaidyTransactions, PaidyTransaction } from '@/lib/gmail';
import { gmailApi } from '@/lib/api';

const GMAIL_TOKEN_KEY = 'paidy_gmail_access_token';

interface PaidyState {
  isSignedIn: boolean;
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
      googleEmail: null,
      paidyAmount: null,
      paidyMonth: null,
      nextPaymentDate: null,
      transactions: [],
      lastSyncedAt: null,
      isLoading: false,
      error: null,

      loadFromServer: async () => {
        try {
          const data = await gmailApi.getIntegration();
          set({
            isSignedIn: true,
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
        await SecureStore.setItemAsync(GMAIL_TOKEN_KEY, accessToken);
        set({ isSignedIn: true, googleEmail: email });
      },

      syncPaidy: async () => {
        set({ isLoading: true, error: null });
        try {
          const token = await SecureStore.getItemAsync(GMAIL_TOKEN_KEY);
          if (!token) throw new Error('No access token');

          const summary = await fetchPaidyTransactions(token);
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
            await gmailApi.upsertIntegration({
              gmail_email: get().googleEmail ?? '',
              paidy_amount: summary.totalAmount,
              paidy_month: summary.month,
              paidy_next_payment_date: summary.nextPaymentDate,
              paidy_transactions: summary.transactions,
              last_synced_at: now,
            });
          } else {
            set({
              paidyAmount: null,
              paidyMonth: null,
              nextPaymentDate: null,
              transactions: [],
              lastSyncedAt: now,
              isLoading: false,
            });
            await gmailApi.upsertIntegration({
              gmail_email: get().googleEmail ?? '',
              paidy_amount: null,
              paidy_month: null,
              paidy_next_payment_date: null,
              paidy_transactions: null,
              last_synced_at: now,
            });
          }
        } catch (err: any) {
          set({ error: err.message ?? '同期に失敗しました', isLoading: false });
        }
      },

      signOut: async () => {
        try {
          await SecureStore.deleteItemAsync(GMAIL_TOKEN_KEY);
          await gmailApi.deleteIntegration();
        } catch {
          // サーバーエラーやトークンなし時も状態リセットは行う
        }
        set({
          isSignedIn: false,
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
        try {
          await SecureStore.deleteItemAsync(GMAIL_TOKEN_KEY);
        } catch {
          // Local store reset should still proceed if secure storage is unavailable.
        }
        set({
          isSignedIn: false,
          googleEmail: null,
          paidyAmount: null,
          paidyMonth: null,
          nextPaymentDate: null,
          transactions: [],
          lastSyncedAt: null,
          isLoading: false,
          error: null,
        });
        await usePaidyStore.persist.clearStorage();
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'paidy-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        isSignedIn: state.isSignedIn,
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
