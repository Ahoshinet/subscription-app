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
