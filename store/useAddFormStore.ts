import { create } from 'zustand';
import { CurrencyId } from '../lib/currency';

interface AddFormState {
    billingCycle: string;
    paymentMethod: string;
    currency: CurrencyId;
    setBillingCycle: (v: string) => void;
    setPaymentMethod: (v: string) => void;
    setCurrency: (v: CurrencyId) => void;
    reset: () => void;
}

const DEFAULTS = {
    billingCycle: 'monthly',
    paymentMethod: 'credit_card',
    currency: 'JPY' as CurrencyId,
};

// Shared with the edit screen (both push the same billing-cycle /
// payment-method / currency picker routes), so the add screen must
// reset() on mount to avoid inheriting whatever the last edit left behind.
export const useAddFormStore = create<AddFormState>((set) => ({
    ...DEFAULTS,
    setBillingCycle: (v) => set({ billingCycle: v }),
    setPaymentMethod: (v) => set({ paymentMethod: v }),
    setCurrency: (v) => set({ currency: v }),
    reset: () => set({ ...DEFAULTS }),
}));

export const BILLING_CYCLES = ['monthly', 'yearly', 'weekly'];

export const PAYMENT_METHODS = [
    'credit_card',
    'debit_card',
    'bank_transfer',
    'paypal',
    'other',
];
