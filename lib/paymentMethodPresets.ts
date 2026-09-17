import type { IoniconsName } from './iconName';

export const PRESET_BRANDS = [
    { id: 'paypal',       label: 'PayPal',         iconName: 'logo-paypal',  color: '#003087' },
    { id: 'apple-pay',    label: 'Apple Pay',       iconName: 'logo-apple',   color: '#000000' },
    { id: 'app-store',    label: 'App Store',       iconName: 'logo-apple',   color: '#0D84F1' },
    { id: 'google-pay',   label: 'Google Pay',      iconName: 'logo-google',  color: '#4285F4' },
    { id: 'google-play',  label: 'Google Play',     iconName: 'logo-google',  color: '#01875F' },
    { id: 'paidy',        label: 'Paidy',           iconName: 'card-outline', color: '#6C47FF' },
    { id: 'amazon-pay',   label: 'Amazon Pay',      iconName: 'cart-outline', color: '#FF9900' },
] as const satisfies readonly {
    id: string;
    label: string;
    iconName: IoniconsName;
    color: string;
}[];

export type PresetBrand = (typeof PRESET_BRANDS)[number];

export const CARD_BRANDS = ['Visa', 'Mastercard', 'JCB', 'Amex', 'Other'];

export const CUSTOM_ICON_PRESETS = [
    { id: 'wallet', iconName: 'wallet-outline', color: '#6B7280' },
    { id: 'card', iconName: 'card-outline', color: '#6B7280' },
    { id: 'cash', iconName: 'cash-outline', color: '#22C55E' },
    { id: 'shopping', iconName: 'cart-outline', color: '#F59E0B' },
    { id: 'streaming', iconName: 'play-circle-outline', color: '#EF4444' },
    { id: 'game', iconName: 'game-controller-outline', color: '#8B5CF6' },
    { id: 'paypal', iconName: 'logo-paypal', color: '#003087' },
    { id: 'apple', iconName: 'logo-apple', color: '#111827' },
    { id: 'google', iconName: 'logo-google', color: '#4285F4' },
] as const satisfies readonly {
    id: string;
    iconName: IoniconsName;
    color: string;
}[];
