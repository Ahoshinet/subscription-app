import { create } from 'zustand';
import { authApi, AuthPayload, User, setToken, clearToken, getToken } from '../lib/api';
import { useSettingsStore } from './useSettingsStore';
import { usePaymentMethodStore } from './usePaymentMethodStore';
import { usePaidyStore } from './usePaidyStore';
import { useSubscriptionStore } from './useSubscriptionStore';

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
        useSettingsStore.getState().resetForLogout(),
        usePaymentMethodStore.getState().resetForLogout(),
        usePaidyStore.getState().resetForLogout(),
    ]);
};

export const useAuthStore = create<AuthState>((set, get) => ({
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
            set({
                user: response.user,
                isAuthenticated: true,
                isLoading: false
            });
            // Sync settings and payment methods from server after login
            useSettingsStore.getState().syncFromServer();
            usePaymentMethodStore.getState().syncFromServer();
        } catch (err: any) {
            set({ error: err.message || 'Login failed', isLoading: false });
            throw err;
        }
    },

    register: async (data: AuthPayload) => {
        set({ isLoading: true, error: null });
        try {
            const response = await authApi.register(data);
            await setToken(response.token);
            set({
                user: response.user,
                isAuthenticated: true,
                isLoading: false
            });
            // Sync settings and payment methods from server after register
            useSettingsStore.getState().syncFromServer();
            usePaymentMethodStore.getState().syncFromServer();
        } catch (err: any) {
            set({ error: err.message || 'Registration failed', isLoading: false });
            throw err;
        }
    },

    logout: async () => {
        set({ isLoading: true });
        try {
            try {
                await clearToken();
            } finally {
                await resetUserScopedStores();
            }
            set({
                user: null,
                isAuthenticated: false,
                isLoading: false,
                error: null
            });
        } catch {
            set({
                user: null,
                isAuthenticated: false,
                isLoading: false,
                error: null,
            });
        }
    },

    checkAuth: async () => {
        set({ isInitializing: true, error: null });
        try {
            const token = await getToken();
            if (!token) {
                set({ isInitializing: false, isAuthenticated: false });
                return;
            }

            const user = await authApi.me();
            set({
                user,
                isAuthenticated: true,
                isInitializing: false
            });
            // Sync settings and payment methods from server on app startup
            useSettingsStore.getState().syncFromServer();
            usePaymentMethodStore.getState().syncFromServer();
        } catch {
            // Token might be invalid or expired
            try {
                await clearToken();
            } catch {
                // Continue local cleanup even if secure token removal fails.
            }
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
