import { create } from 'zustand';
import { getSystemCurrency, CurrencyId } from '../lib/currency';

interface AddFormState {
    billingCycle: string;
    paymentMethod: string;
    currency: CurrencyId;
    setBillingCycle: (v: string) => void;
    setPaymentMethod: (v: string) => void;
    setCurrency: (v: CurrencyId) => void;
}

export const useAddFormStore = create<AddFormState>((set) => ({
    billingCycle: 'monthly',
    paymentMethod: 'credit_card',
    currency: getSystemCurrency(),
    setBillingCycle: (v) => set({ billingCycle: v }),
    setPaymentMethod: (v) => set({ paymentMethod: v }),
    setCurrency: (v) => set({ currency: v }),
}));

export const BILLING_CYCLES = ['monthly', 'yearly', 'weekly'];

export const PAYMENT_METHODS = [
    'credit_card',
    'debit_card',
    'bank_transfer',
    'paypal',
    'other',
];
