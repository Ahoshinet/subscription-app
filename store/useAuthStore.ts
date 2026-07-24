import { create } from 'zustand';
import { authApi, AuthPayload, User, setToken, clearToken, getToken, ApiError, setOnUnauthorized } from '../lib/api';
import { useSettingsStore } from './useSettingsStore';
import { usePaymentMethodStore } from './usePaymentMethodStore';
import { usePaidyStore } from './usePaidyStore';
import { useSubscriptionStore } from './useSubscriptionStore';
import { cancelAllReminders } from '../lib/notifications';
import { activateAuthSession, getAuthTokenUserId, invalidateAuthSession } from '../lib/authSession';
import { getErrorMessage } from '../lib/errors';

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    isInitializing: boolean;
    error: string | null;

    // Actions
    login: (data: AuthPayload) => Promise<void>;
    register: (data: AuthPayload) => Promise<void>;
    logout: () => Promise<void>;
    checkAuth: () => Promise<void>;
    clearError: () => void;
}

const resetUserScopedStores = async () => {
    useSubscriptionStore.getState().resetForLogout();
    await Promise.allSettled([
        cancelAllReminders(),
        useSettingsStore.getState().resetForLogout(),
        usePaymentMethodStore.getState().resetForLogout(),
        usePaidyStore.getState().resetForLogout(),
    ]);
};

const syncUserScopedStores = async () => {
    await Promise.allSettled([
        useSettingsStore.getState().syncFromServer(),
        usePaymentMethodStore.getState().syncFromServer(),
        usePaidyStore.getState().loadFromServer(),
    ]);
};

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    isInitializing: true,
    error: null,

    login: async (data: AuthPayload) => {
        set({ isLoading: true, error: null });
        try {
            const response = await authApi.login(data);
            await setToken(response.token);
            activateAuthSession(response.user.id);
            set({
                user: response.user,
                isAuthenticated: true,
                isLoading: false
            });
            await syncUserScopedStores();
        } catch (error: unknown) {
            set({ error: getErrorMessage(error, 'Login failed'), isLoading: false });
            throw error;
        }
    },

    register: async (data: AuthPayload) => {
        set({ isLoading: true, error: null });
        try {
            const response = await authApi.register(data);
            await setToken(response.token);
            activateAuthSession(response.user.id);
            set({
                user: response.user,
                isAuthenticated: true,
                isLoading: false
            });
            await syncUserScopedStores();
        } catch (error: unknown) {
            set({
                error: getErrorMessage(error, 'Registration failed'),
                isLoading: false,
            });
            throw error;
        }
    },

    logout: async () => {
        set({ isLoading: true });
        try {
            // Do not present a successful logout while a reusable credential
            // may still be present on the device.
            await clearToken();
            invalidateAuthSession();
            await resetUserScopedStores();
            set({
                user: null,
                isAuthenticated: false,
                isLoading: false,
                error: null
            });
        } catch (error: unknown) {
            set({
                isLoading: false,
                error: getErrorMessage(error, 'ログアウトに失敗しました'),
            });
            throw error;
        }
    },

    checkAuth: async () => {
        set({ isInitializing: true, error: null });
        let token: string | null = null;
        try {
            token = await getToken();
            if (!token) {
                invalidateAuthSession();
                await resetUserScopedStores();
                set({ user: null, isInitializing: false, isAuthenticated: false });
                return;
            }

            const user = await authApi.me();
            activateAuthSession(user.id);
            set({
                user,
                isAuthenticated: true,
                isInitializing: false
            });
            await syncUserScopedStores();
        } catch (error: unknown) {
            // Only destroy credentials on a definitive auth failure. A network
            // error (offline / server down) must not log the user out.
            const isAuthFailure = error instanceof ApiError
                && (error.status === 401 || error.status === 403 || error.status === 404);

            if (!isAuthFailure) {
                // Transient error: keep the token, let the user in with locally
                // persisted data. The JWT subject is used only to scope local
                // async work; the server still validates the token on requests.
                const userId = token ? getAuthTokenUserId(token) : null;
                const currentToken = await getToken();
                if (userId && currentToken === token) {
                    activateAuthSession(userId);
                    set({ isAuthenticated: true, isInitializing: false });
                } else {
                    set({ user: null, isAuthenticated: false, isInitializing: false });
                }
                return;
            }

            await clearToken().catch((clearError) => {
                console.error('Failed to remove rejected credential:', clearError);
            });
            invalidateAuthSession();
            await resetUserScopedStores();
            set({
                user: null,
                isAuthenticated: false,
                isInitializing: false
            });
        }
    },

    clearError: () => set({ error: null }),
}));

// Force logout when a 401 cannot be recovered by token refresh, so the user
// is returned to the login screen instead of hitting errors on every action.
setOnUnauthorized(() => {
    if (useAuthStore.getState().isAuthenticated) {
        void useAuthStore.getState().logout().catch(() => {});
    }
});
