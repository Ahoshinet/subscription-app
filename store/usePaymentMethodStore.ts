import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PaymentMethod, paymentMethodApi, uploadApi } from '../lib/api';
import { captureAuthSession, isAuthSessionCurrent } from '../lib/authSession';

const PAYMENT_METHODS_STORAGE_KEY = 'payment-methods-storage';

const SAVED_PAYMENT_METHOD_TYPES = ['preset', 'credit_card', 'custom'] as const;

export type SavedPaymentMethodType = typeof SAVED_PAYMENT_METHOD_TYPES[number];

export function isSavedPaymentMethodType(
    value: unknown,
): value is SavedPaymentMethodType {
    return typeof value === 'string'
        && SAVED_PAYMENT_METHOD_TYPES.some((type) => type === value);
}

export interface SavedPaymentMethod {
    id: string;
    type: SavedPaymentMethodType;
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

const fromApiPaymentMethod = (method: PaymentMethod): SavedPaymentMethod => ({
    id: method.id,
    type: isSavedPaymentMethodType(method.type) ? method.type : 'custom',
    label: method.label,
    iconName: method.icon_name,
    iconUri: method.icon_uri,
    color: method.color,
    last4: method.last4,
    cardBrand: method.card_brand,
    memo: method.memo,
});

export const usePaymentMethodStore = create<PaymentMethodState>()(
    persist(
        (set) => ({
            methods: [],
            isSyncing: false,

            addMethod: async (method) => {
                let pendingIconUrl: string | undefined;
                try {
                    let iconUri = method.iconUri;
                    if (iconUri && !iconUri.startsWith('/uploads/') && !iconUri.startsWith('http')) {
                        const uploaded = await uploadApi.uploadIcon(iconUri);
                        iconUri = uploaded.url;
                        pendingIconUrl = uploaded.url;
                    }
                    const created = await paymentMethodApi.create({
                        type: method.type,
                        label: method.label,
                        icon_name: method.iconName,
                        icon_uri: iconUri,
                        color: method.color,
                        last4: method.last4,
                        card_brand: method.cardBrand,
                        memo: method.memo,
                    });
                    set((state) => ({
                        methods: [...state.methods, fromApiPaymentMethod(created)],
                    }));
                    return created.id;
                } catch (error) {
                    if (pendingIconUrl?.startsWith('/uploads/pending/')) {
                        await uploadApi.deletePending(pendingIconUrl).catch(() => {});
                    }
                    throw error;
                }
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
                const localUpdates: Partial<Omit<SavedPaymentMethod, 'id'>> = {};
                if ('label' in updates) localUpdates.label = updates.label;
                if ('iconName' in updates) {
                    localUpdates.iconName = updates.iconName ?? undefined;
                }
                if ('iconUri' in updates) {
                    localUpdates.iconUri = updates.iconUri ?? undefined;
                }
                if ('color' in updates) localUpdates.color = updates.color;
                if ('last4' in updates) {
                    localUpdates.last4 = updates.last4 ?? undefined;
                }
                if ('cardBrand' in updates) {
                    localUpdates.cardBrand = updates.cardBrand ?? undefined;
                }
                if ('memo' in updates) {
                    localUpdates.memo = updates.memo ?? undefined;
                }
                set((state) => ({
                    methods: state.methods.map((m) =>
                        m.id === id ? { ...m, ...localUpdates } : m
                    ),
                }));
            },

            syncFromServer: async () => {
                const session = captureAuthSession();
                if (!session) return;
                try {
                    set({ isSyncing: true });
                    let serverMethods = await paymentMethodApi.getAll();
                    if (!isAuthSessionCurrent(session)) return;
                    let migratedLegacyIcon = false;
                    for (const method of serverMethods) {
                        const localUri = method.icon_uri;
                        if (!localUri || !/^(file|content|blob|data):/.test(localUri)) continue;
                        let pendingUrl: string | undefined;
                        try {
                            const uploaded = await uploadApi.uploadIcon(localUri);
                            pendingUrl = uploaded.url;
                            await paymentMethodApi.update(method.id, { icon_uri: pendingUrl });
                            migratedLegacyIcon = true;
                        } catch {
                            if (pendingUrl?.startsWith('/uploads/pending/')) {
                                await uploadApi.deletePending(pendingUrl).catch(() => {});
                            }
                        }
                        if (!isAuthSessionCurrent(session)) return;
                    }
                    if (migratedLegacyIcon) {
                        serverMethods = await paymentMethodApi.getAll();
                        if (!isAuthSessionCurrent(session)) return;
                    }
                    const mapped = serverMethods.map(fromApiPaymentMethod);
                    set({ methods: mapped, isSyncing: false });
                } catch {
                    if (isAuthSessionCurrent(session)) set({ isSyncing: false });
                }
            },

            resetForLogout: async () => {
                set({ methods: [], isSyncing: false });
                await AsyncStorage.removeItem(PAYMENT_METHODS_STORAGE_KEY);
            },
        }),
        {
            name: PAYMENT_METHODS_STORAGE_KEY,
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
