import { create } from 'zustand';

interface AddFormState {
    billingCycle: string;
    paymentMethod: string;
    setBillingCycle: (v: string) => void;
    setPaymentMethod: (v: string) => void;
}

export const useAddFormStore = create<AddFormState>((set) => ({
    billingCycle: 'monthly',
    paymentMethod: 'credit_card',
    setBillingCycle: (v) => set({ billingCycle: v }),
    setPaymentMethod: (v) => set({ paymentMethod: v }),
}));

export const BILLING_CYCLES = ['monthly', 'yearly', 'weekly'];

export const PAYMENT_METHODS = [
    'credit_card',
    'debit_card',
    'bank_transfer',
    'paypal',
    'other',
];
