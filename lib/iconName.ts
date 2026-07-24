import { Ionicons } from '@expo/vector-icons';

export type IoniconsName = keyof typeof Ionicons.glyphMap;

export function isIoniconsName(value: unknown): value is IoniconsName {
    return typeof value === 'string' && value in Ionicons.glyphMap;
}

export function getIoniconsName(
    value: unknown,
    fallback: IoniconsName = 'card-outline',
): IoniconsName {
    return isIoniconsName(value) ? value : fallback;
}
