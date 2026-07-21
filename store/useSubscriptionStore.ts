import { create } from 'zustand';
import { subscriptionApi, Subscription, CreateSubscriptionPayload, UpdateSubscriptionPayload } from '../lib/api';
import { captureAuthSession, isAuthSessionCurrent } from '../lib/authSession';

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

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
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
            } catch (err: any) {
                if (isAuthSessionCurrent(session)) {
                    set({ error: err.message || 'Failed to fetch subscriptions', isLoading: false });
                }
            }
        }
    },

    addSubscription: async (data: CreateSubscriptionPayload) => {
        set({ isLoading: true, error: null });
        try {
            const newSub = await subscriptionApi.create(data);
            set((state) => ({
                subscriptions: [...state.subscriptions, newSub],
                isLoading: false,
            }));
        } catch (err: any) {
            set({ error: err.message || 'Failed to add subscription', isLoading: false });
            throw err; // throw to handle it in UI (e.g., closing modal)
        }
    },

    updateSubscription: async (id: number, data: UpdateSubscriptionPayload) => {
        set({ isLoading: true, error: null });
        try {
            const updatedSub = await subscriptionApi.update(id, data);
            set((state) => ({
                subscriptions: state.subscriptions.map((sub) =>
                    sub.id === id ? { ...sub, ...updatedSub } : sub
                ),
                isLoading: false,
            }));
        } catch (err: any) {
            set({ error: err.message || 'Failed to update subscription', isLoading: false });
            throw err;
        }
    },

    deleteSubscription: async (id: number) => {
        set({ isLoading: true, error: null });
        try {
            await subscriptionApi.delete(id);
            set((state) => ({
                subscriptions: state.subscriptions.filter((sub) => sub.id !== id),
                isLoading: false,
            }));
        } catch (err: any) {
            set({ error: err.message || 'Failed to delete subscription', isLoading: false });
            throw err;
        }
    },

    clearError: () => set({ error: null }),
    resetForLogout: () => set({ subscriptions: [], isLoading: false, error: null }),
}));
