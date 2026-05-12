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

interface PaymentMethodState {
    methods: SavedPaymentMethod[];
    isSyncing: boolean;
    addMethod: (method: Omit<SavedPaymentMethod, 'id'>) => Promise<string>;
    removeMethod: (id: string) => Promise<void>;
    updateMethod: (id: string, updates: Partial<Omit<SavedPaymentMethod, 'id'>>) => Promise<void>;
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

            removeMethod: async (id) => {
                set((state) => ({
                    methods: state.methods.filter((m) => m.id !== id),
                }));
                try {
                    await paymentMethodApi.delete(id);
                } catch {
                    // Already removed locally
                }
            },

            updateMethod: async (id, updates) => {
                set((state) => ({
                    methods: state.methods.map((m) =>
                        m.id === id ? { ...m, ...updates } : m
                    ),
                }));
                try {
                    await paymentMethodApi.update(id, {
                        label: updates.label,
                        icon_name: updates.iconName,
                        icon_uri: updates.iconUri,
                        color: updates.color,
                        last4: updates.last4,
                        card_brand: updates.cardBrand,
                        memo: updates.memo,
                    });
                } catch {
                    // Local update already applied
                }
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
