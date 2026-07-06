export const CURRENCIES = [
    { id: 'JPY', symbol: '¥', name: 'Japanese Yen' },
    { id: 'USD', symbol: '$', name: 'US Dollar' },
    { id: 'EUR', symbol: '€', name: 'Euro' },
    { id: 'GBP', symbol: '£', name: 'British Pound' },
] as const;

export type CurrencyId = typeof CURRENCIES[number]['id'];

export const CURRENCY_SYMBOLS: Record<string, string> = {
    JPY: '¥',
    USD: '$',
    EUR: '€',
    GBP: '£',
};

const REGION_TO_CURRENCY: Record<string, CurrencyId> = {
    JP: 'JPY',
    US: 'USD', CA: 'USD', AU: 'USD', NZ: 'USD',
    GB: 'GBP',
    DE: 'EUR', FR: 'EUR', IT: 'EUR', ES: 'EUR',
    NL: 'EUR', BE: 'EUR', AT: 'EUR', PT: 'EUR',
    FI: 'EUR', IE: 'EUR', GR: 'EUR', LU: 'EUR',
};

// The largest amount that can survive the round trip through IEEE 754
// doubles (JS numbers / JSON). Anything above this is silently rounded
// (e.g. 1145141919364364810 becomes …800), so inputs beyond it must be
// rejected instead of stored corrupted.
export const MAX_AMOUNT = Number.MAX_SAFE_INTEGER;

function normalizeAmountInput(input: string): string {
    return input
        .replace(/[０-９．]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xfee0))
        .replace(/[,，]/g, '')
        .trim();
}

export function isAmountInputAboveMax(input: string): boolean {
    const normalized = normalizeAmountInput(input);
    if (!normalized) return false;

    const value = Number(normalized);
    if (!Number.isFinite(value) || value < 0) return false;
    if (value > MAX_AMOUNT) return true;

    const decimalMatch = normalized.match(/^\+?(\d+)(?:\.(\d*))?$/);
    if (!decimalMatch) return false;

    const integerPart = decimalMatch[1].replace(/^0+(?=\d)/, '');
    const maxInteger = String(MAX_AMOUNT);
    if (integerPart.length !== maxInteger.length) {
        return integerPart.length > maxInteger.length;
    }
    if (integerPart !== maxInteger) {
        return integerPart > maxInteger;
    }

    return /[1-9]/.test(decimalMatch[2] ?? '');
}

// Parse a user-entered amount string. Accepts full-width digits and
// thousand separators (e.g. "１,０００"). Returns null when the input is
// empty or not a valid non-negative finite number.
export function parseAmountInput(input: string): number | null {
    const normalized = normalizeAmountInput(input);
    if (!normalized) return null;
    const value = Number(normalized);
    if (!Number.isFinite(value) || value < 0) return null;
    return value;
}

// Convert a subscription amount to its monthly equivalent so spending
// totals don't count weekly/yearly amounts as if they were monthly:
// yearly is spread across 12 months, weekly uses the average number of
// weeks per month (52 / 12).
export function toMonthlyAmount(amount: number, billingCycle: string): number {
    switch (billingCycle) {
        case 'yearly':
            return amount / 12;
        case 'weekly':
            return amount * (52 / 12);
        default:
            return amount;
    }
}

export function getSystemCurrency(): CurrencyId {
    try {
        const locale = Intl.DateTimeFormat().resolvedOptions().locale;
        const parts = locale.split('-');
        const region = parts[parts.length - 1].toUpperCase();
        return REGION_TO_CURRENCY[region] ?? 'JPY';
    } catch {
        return 'JPY';
    }
}
