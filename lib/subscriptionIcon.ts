import type { ComponentProps } from 'react';
import type { FontAwesome5 } from '@expo/vector-icons';
import type { IoniconsName } from './iconName';

export type SubscriptionIconPack = 'ionicons' | 'fontawesome5';
export type FontAwesome5Name = ComponentProps<typeof FontAwesome5>['name'];

interface SubscriptionIconBase {
    id: string;
    color: string;
    label: string;
}

export type SubscriptionIconPreset = SubscriptionIconBase & (
    | { pack: 'ionicons'; name: IoniconsName }
    | { pack: 'fontawesome5'; name: FontAwesome5Name }
);

export type SubscriptionIconSelection =
    | { pack: 'ionicons'; name: IoniconsName; color: string }
    | { pack: 'fontawesome5'; name: FontAwesome5Name; color: string };

export const SUBSCRIPTION_ICON_PRESETS: readonly SubscriptionIconPreset[] = [
    { id: 'cube', pack: 'ionicons', name: 'cube-outline', color: '#3B82F6', label: 'General' },
    { id: 'play', pack: 'ionicons', name: 'play-circle-outline', color: '#EF4444', label: 'Video' },
    { id: 'tv', pack: 'ionicons', name: 'tv-outline', color: '#6366F1', label: 'TV' },
    { id: 'music', pack: 'ionicons', name: 'musical-notes-outline', color: '#EC4899', label: 'Music' },
    { id: 'game', pack: 'ionicons', name: 'game-controller-outline', color: '#8B5CF6', label: 'Gaming' },
    { id: 'book', pack: 'ionicons', name: 'book-outline', color: '#0EA5E9', label: 'Books' },
    { id: 'school', pack: 'ionicons', name: 'school-outline', color: '#14B8A6', label: 'Learning' },
    { id: 'cloud', pack: 'ionicons', name: 'cloud-outline', color: '#06B6D4', label: 'Cloud' },
    { id: 'chat', pack: 'ionicons', name: 'chatbubble-ellipses-outline', color: '#22C55E', label: 'Chat' },
    { id: 'server', pack: 'ionicons', name: 'server-outline', color: '#0F172A', label: 'Server' },
    { id: 'wallet', pack: 'ionicons', name: 'wallet-outline', color: '#6B7280', label: 'Wallet' },
    { id: 'card', pack: 'ionicons', name: 'card-outline', color: '#6B7280', label: 'Card' },
    { id: 'cart', pack: 'ionicons', name: 'cart-outline', color: '#F59E0B', label: 'Shopping' },
    { id: 'cafe', pack: 'ionicons', name: 'cafe-outline', color: '#A16207', label: 'Food' },
    { id: 'fitness', pack: 'ionicons', name: 'fitness-outline', color: '#10B981', label: 'Health' },
    { id: 'netflix', pack: 'fontawesome5', name: 'film', color: '#E50914', label: 'Netflix' },
    { id: 'youtube', pack: 'fontawesome5', name: 'youtube', color: '#FF0000', label: 'YouTube' },
    { id: 'spotify', pack: 'fontawesome5', name: 'spotify', color: '#1DB954', label: 'Spotify' },
    { id: 'discord', pack: 'fontawesome5', name: 'discord', color: '#5865F2', label: 'Discord' },
    { id: 'twitch', pack: 'fontawesome5', name: 'twitch', color: '#9146FF', label: 'Twitch' },
    { id: 'github', pack: 'fontawesome5', name: 'github', color: '#111827', label: 'GitHub' },
    { id: 'paypal', pack: 'fontawesome5', name: 'paypal', color: '#003087', label: 'PayPal' },
    { id: 'apple', pack: 'fontawesome5', name: 'apple', color: '#111827', label: 'Apple' },
    { id: 'google', pack: 'fontawesome5', name: 'google', color: '#4285F4', label: 'Google' },
    { id: 'microsoft', pack: 'fontawesome5', name: 'microsoft', color: '#5E5E5E', label: 'Microsoft' },
    { id: 'amazon', pack: 'fontawesome5', name: 'amazon', color: '#FF9900', label: 'Amazon' },
    { id: 'steam', pack: 'fontawesome5', name: 'steam', color: '#0B1A2B', label: 'Steam' },
    { id: 'visa', pack: 'fontawesome5', name: 'cc-visa', color: '#1A1F71', label: 'Visa' },
    { id: 'mastercard', pack: 'fontawesome5', name: 'cc-mastercard', color: '#EB001B', label: 'Mastercard' },
] as const;

const ICON_PREFIX = 'icon:';

export const buildSubscriptionPresetIconValue = (
    icon: SubscriptionIconSelection,
) => `${ICON_PREFIX}${icon.pack}:${icon.name}:${encodeURIComponent(icon.color)}`;

export const parseSubscriptionPresetIconValue = (value?: string | null) => {
    if (!value || !value.startsWith(ICON_PREFIX)) return null;

    const parts = value.split(':');
    if (parts.length < 4) return null;

    const preset = SUBSCRIPTION_ICON_PRESETS.find(
        (icon) => icon.pack === parts[1] && icon.name === parts[2],
    );
    if (!preset) return null;

    const color = decodeURIComponent(parts.slice(3).join(':'));

    return preset.pack === 'ionicons'
        ? { pack: 'ionicons', name: preset.name, color }
        : { pack: 'fontawesome5', name: preset.name, color };
};

export const isSubscriptionPresetIconValue = (value?: string | null) =>
    Boolean(parseSubscriptionPresetIconValue(value));
