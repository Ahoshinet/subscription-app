import { create } from 'zustand';
import { authApi, AuthPayload, User, setToken, clearToken, getToken } from '../lib/api';

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
        } catch (err: any) {
            set({ error: err.message || 'Registration failed', isLoading: false });
            throw err;
        }
    },

    logout: async () => {
        set({ isLoading: true });
        try {
            await clearToken();
            set({
                user: null,
                isAuthenticated: false,
                isLoading: false,
                error: null
            });
        } catch (err) {
            set({ isLoading: false });
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
        } catch (err: any) {
            // Token might be invalid or expired
            await clearToken();
            set({
                user: null,
                isAuthenticated: false,
                isInitializing: false
            });
        }
    },

    clearError: () => set({ error: null }),
}));
