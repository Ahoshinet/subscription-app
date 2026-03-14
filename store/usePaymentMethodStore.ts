import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface SavedPaymentMethod {
    id: string;
    type: 'preset' | 'credit_card' | 'custom';
    label: string;
    iconName?: string;
    iconUri?: string;
    color: string;
    last4?: string;
    cardBrand?: string;
}

interface PaymentMethodState {
    methods: SavedPaymentMethod[];
    addMethod: (method: Omit<SavedPaymentMethod, 'id'>) => string;
    removeMethod: (id: string) => void;
}

export const usePaymentMethodStore = create<PaymentMethodState>()(
    persist(
        (set) => ({
            methods: [],
            addMethod: (method) => {
                const id = Date.now().toString();
                set((state) => ({
                    methods: [...state.methods, { ...method, id }],
                }));
                return id;
            },
            removeMethod: (id) =>
                set((state) => ({
                    methods: state.methods.filter((m) => m.id !== id),
                })),
        }),
        {
            name: 'payment-methods-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
