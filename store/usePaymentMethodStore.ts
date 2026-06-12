import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { paymentMethodApi } from '../lib/api';

export interface SavedPaymentMethod {
    id: string;
    type: 'preset' | 'credit_card' | 'custom';
    label: string;
    iconName?: string;
    iconUri?: string;
    color: string;
    last4?: string;
    cardBrand?: string;
    memo?: string;
}

// Update payload: a present key with null explicitly clears that field on
// the server; an absent key leaves it unchanged.
export interface PaymentMethodUpdates {
    label?: string;
    iconName?: string | null;
    iconUri?: string | null;
    color?: string;
    last4?: string | null;
    cardBrand?: string | null;
    memo?: string | null;
}

interface PaymentMethodState {
    methods: SavedPaymentMethod[];
    isSyncing: boolean;
    addMethod: (method: Omit<SavedPaymentMethod, 'id'>) => Promise<string>;
    removeMethod: (id: string) => Promise<void>;
    updateMethod: (id: string, updates: PaymentMethodUpdates) => Promise<void>;
    syncFromServer: () => Promise<void>;
    resetForLogout: () => Promise<void>;
}

export const usePaymentMethodStore = create<PaymentMethodState>()(
    persist(
        (set, get) => ({
            methods: [],
            isSyncing: false,

            addMethod: async (method) => {
                const created = await paymentMethodApi.create({
                    type: method.type,
                    label: method.label,
                    icon_name: method.iconName,
                    icon_uri: method.iconUri,
                    color: method.color,
                    last4: method.last4,
                    card_brand: method.cardBrand,
                    memo: method.memo,
                });
                set((state) => ({
                    methods: [...state.methods, { ...method, id: created.id }],
                }));
                return created.id;
            },

            // Server-first: local state only changes after the API call
            // succeeds, so failures (e.g. 409 method-in-use on delete)
            // propagate to the UI instead of silently diverging.
            removeMethod: async (id) => {
                await paymentMethodApi.delete(id);
                set((state) => ({
                    methods: state.methods.filter((m) => m.id !== id),
                }));
            },

            updateMethod: async (id, updates) => {
                // JSON.stringify drops undefined values, so absent keys are
                // omitted from the request while explicit nulls go through.
                await paymentMethodApi.update(id, {
                    label: updates.label,
                    icon_name: 'iconName' in updates ? updates.iconName ?? null : undefined,
                    icon_uri: 'iconUri' in updates ? updates.iconUri ?? null : undefined,
                    color: updates.color,
                    last4: 'last4' in updates ? updates.last4 ?? null : undefined,
                    card_brand: 'cardBrand' in updates ? updates.cardBrand ?? null : undefined,
                    memo: 'memo' in updates ? updates.memo ?? null : undefined,
                });
                const localUpdates = Object.fromEntries(
                    Object.entries(updates).map(([k, v]) => [k, v ?? undefined])
                ) as Partial<Omit<SavedPaymentMethod, 'id'>>;
                set((state) => ({
                    methods: state.methods.map((m) =>
                        m.id === id ? { ...m, ...localUpdates } : m
                    ),
                }));
            },

            syncFromServer: async () => {
                try {
                    set({ isSyncing: true });
                    const serverMethods = await paymentMethodApi.getAll();
                    const mapped: SavedPaymentMethod[] = serverMethods.map((m) => ({
                        id: m.id,
                        type: m.type as SavedPaymentMethod['type'],
                        label: m.label,
                        iconName: m.icon_name,
                        iconUri: m.icon_uri,
                        color: m.color,
                        last4: m.last4,
                        cardBrand: m.card_brand,
                        memo: m.memo,
                    }));
                    set({ methods: mapped, isSyncing: false });
                } catch {
                    set({ isSyncing: false });
                }
            },

            resetForLogout: async () => {
                set({ methods: [], isSyncing: false });
                await usePaymentMethodStore.persist.clearStorage();
            },
        }),
        {
            name: 'payment-methods-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
