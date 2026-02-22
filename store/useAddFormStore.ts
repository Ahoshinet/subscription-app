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

export const BILLING_CYCLES = [
    { label: '月額 (Monthly)', value: 'monthly' },
    { label: '年額 (Yearly)', value: 'yearly' },
    { label: '週額 (Weekly)', value: 'weekly' },
];

export const PAYMENT_METHODS = [
    { label: 'クレジットカード', value: 'credit_card' },
    { label: 'デビットカード', value: 'debit_card' },
    { label: '銀行振込', value: 'bank_transfer' },
    { label: 'PayPal', value: 'paypal' },
    { label: 'その他', value: 'other' },
];
