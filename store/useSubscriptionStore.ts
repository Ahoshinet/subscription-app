import { create } from 'zustand';
import { subscriptionApi, Subscription, CreateSubscriptionPayload, UpdateSubscriptionPayload } from '../lib/api';
import { captureAuthSession, isAuthSessionCurrent } from '../lib/authSession';
import { getErrorMessage } from '../lib/errors';

interface SubscriptionState {
    subscriptions: Subscription[];
    isLoading: boolean;
    error: string | null;

    // Actions
    fetchSubscriptions: () => Promise<void>;
    addSubscription: (data: CreateSubscriptionPayload) => Promise<void>;
    updateSubscription: (id: number, data: UpdateSubscriptionPayload) => Promise<void>;
    deleteSubscription: (id: number) => Promise<void>;
    clearError: () => void;
    resetForLogout: () => void;
}

export const useSubscriptionStore = create<SubscriptionState>((set) => ({
    subscriptions: [],
    isLoading: false,
    error: null,

    fetchSubscriptions: async () => {
        const session = captureAuthSession();
        if (!session) return;
        set({ isLoading: true, error: null });
        try {
            // Ask the server to roll over overdue payment dates first; it
            // returns the refreshed list in the same call.
            const { subscriptions } = await subscriptionApi.renew();
            if (!isAuthSessionCurrent(session)) return;
            set({ subscriptions, isLoading: false });
        } catch {
            // Older servers (or transient renew failures) — fall back to a plain list fetch
            try {
                const data = await subscriptionApi.getAll();
                if (!isAuthSessionCurrent(session)) return;
                set({ subscriptions: data, isLoading: false });
            } catch (error: unknown) {
                if (isAuthSessionCurrent(session)) {
                    set({
                        error: getErrorMessage(error, 'Failed to fetch subscriptions'),
                        isLoading: false,
                    });
                }
            }
        }
    },

    addSubscription: async (data: CreateSubscriptionPayload) => {
        const session = captureAuthSession();
        if (!session) return;
        set({ isLoading: true, error: null });
        try {
            const newSub = await subscriptionApi.create(data);
            if (!isAuthSessionCurrent(session)) return;
            set((state) => ({
                subscriptions: [...state.subscriptions, newSub],
                isLoading: false,
            }));
        } catch (error: unknown) {
            if (isAuthSessionCurrent(session)) {
                set({
                    error: getErrorMessage(error, 'Failed to add subscription'),
                    isLoading: false,
                });
            }
            throw error; // throw to handle it in UI (e.g., closing modal)
        }
    },

    updateSubscription: async (id: number, data: UpdateSubscriptionPayload) => {
        const session = captureAuthSession();
        if (!session) return;
        set({ isLoading: true, error: null });
        try {
            const updatedSub = await subscriptionApi.update(id, data);
            if (!isAuthSessionCurrent(session)) return;
            set((state) => ({
                subscriptions: state.subscriptions.map((sub) =>
                    sub.id === id ? { ...sub, ...updatedSub } : sub
                ),
                isLoading: false,
            }));
        } catch (error: unknown) {
            if (isAuthSessionCurrent(session)) {
                set({
                    error: getErrorMessage(error, 'Failed to update subscription'),
                    isLoading: false,
                });
            }
            throw error;
        }
    },

    deleteSubscription: async (id: number) => {
        const session = captureAuthSession();
        if (!session) return;
        set({ isLoading: true, error: null });
        try {
            await subscriptionApi.delete(id);
            if (!isAuthSessionCurrent(session)) return;
            set((state) => ({
                subscriptions: state.subscriptions.filter((sub) => sub.id !== id),
                isLoading: false,
            }));
        } catch (error: unknown) {
            if (isAuthSessionCurrent(session)) {
                set({
                    error: getErrorMessage(error, 'Failed to delete subscription'),
                    isLoading: false,
                });
            }
            throw error;
        }
    },

    clearError: () => set({ error: null }),
    resetForLogout: () => set({ subscriptions: [], isLoading: false, error: null }),
}));
