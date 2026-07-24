import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { settingsApi, UserSettings } from '../lib/api';
import { CurrencyId, getSystemCurrency, isCurrencyId } from '../lib/currency';
import { getDeviceTimeZone } from '../lib/timeZone';
import { captureAuthSession, isAuthSessionCurrent } from '../lib/authSession';

export type Language = 'en' | 'ja';
export type ThemePreference = 'system' | 'light' | 'dark';

const LANGUAGES: readonly Language[] = ['en', 'ja'];
const THEME_PREFERENCES: readonly ThemePreference[] = ['system', 'light', 'dark'];

export function isLanguage(value: unknown): value is Language {
    return typeof value === 'string'
        && LANGUAGES.some((language) => language === value);
}

export function isThemePreference(value: unknown): value is ThemePreference {
    return typeof value === 'string'
        && THEME_PREFERENCES.some((theme) => theme === value);
}

type SettingsPatch = Partial<Pick<
    UserSettings,
    'language' | 'currency' | 'push_notifications' | 'theme' | 'time_zone'
>>;

const mutationQueues = new Map<string, Promise<void>>();
const SETTINGS_STORAGE_KEY = 'settings-storage';

interface SettingsState {
    language: Language;
    currency: CurrencyId;
    pushNotifications: boolean;
    theme: ThemePreference;
    timeZone: string;
    isSyncing: boolean;
    syncError: boolean;

    setLanguage: (lang: Language) => void;
    setCurrency: (currency: CurrencyId) => void;
    setPushNotifications: (enabled: boolean) => void;
    setTheme: (theme: ThemePreference) => void;
    setTimeZone: (timeZone: string) => void;
    clearSyncError: () => void;
    resetForLogout: () => Promise<void>;
    syncFromServer: () => Promise<void>;
    syncToServer: (patch: SettingsPatch) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set, get) => ({
            language: 'en',
            currency: getSystemCurrency(),
            pushNotifications: true,
            theme: 'system',
            timeZone: getDeviceTimeZone(),
            isSyncing: false,
            syncError: false,

            setLanguage: (lang) => {
                set({ language: lang });
                void get().syncToServer({ language: lang });
            },
            setCurrency: (currency) => {
                set({ currency });
                void get().syncToServer({ currency });
            },
            setPushNotifications: (enabled) => {
                set({ pushNotifications: enabled });
                void get().syncToServer({ push_notifications: enabled });
            },
            setTheme: (theme) => {
                set({ theme });
                void get().syncToServer({ theme });
            },
            setTimeZone: (timeZone) => {
                set({ timeZone });
                void get().syncToServer({ time_zone: timeZone });
            },
            clearSyncError: () => set({ syncError: false }),
            resetForLogout: async () => {
                set({
                    language: 'en',
                    currency: getSystemCurrency(),
                    pushNotifications: true,
                    theme: 'system',
                    timeZone: getDeviceTimeZone(),
                    isSyncing: false,
                    syncError: false,
                });
                await AsyncStorage.removeItem(SETTINGS_STORAGE_KEY);
            },

            syncFromServer: async () => {
                const session = captureAuthSession();
                if (!session) return;
                try {
                    set({ isSyncing: true });
                    const settings = await settingsApi.get();
                    if (!isAuthSessionCurrent(session)) return;
                    set({
                        language: isLanguage(settings.language) ? settings.language : 'en',
                        currency: isCurrencyId(settings.currency)
                            ? settings.currency
                            : getSystemCurrency(),
                        pushNotifications: settings.push_notifications ?? true,
                        theme: isThemePreference(settings.theme)
                            ? settings.theme
                            : 'system',
                        timeZone: settings.time_zone || getDeviceTimeZone(),
                        isSyncing: false,
                    });
                } catch {
                    if (isAuthSessionCurrent(session)) {
                        set({ isSyncing: false, syncError: true });
                    }
                }
            },

            syncToServer: async (patch) => {
                const session = captureAuthSession();
                if (!session) return;
                const fields = Object.keys(patch).sort().join(',');
                const queueKey = `${session.userId}:${fields}`;
                const previous = mutationQueues.get(queueKey) ?? Promise.resolve();
                set({ isSyncing: true });
                const mutation = previous
                    .catch(() => {})
                    .then(async () => {
                        if (!isAuthSessionCurrent(session)) return;
                        await settingsApi.update(patch);
                    });
                mutationQueues.set(queueKey, mutation);
                try {
                    await mutation;
                } catch {
                    if (isAuthSessionCurrent(session)) set({ syncError: true });
                } finally {
                    if (mutationQueues.get(queueKey) === mutation) {
                        mutationQueues.delete(queueKey);
                    }
                    const hasPendingForUser = Array.from(mutationQueues.keys())
                        .some((key) => key.startsWith(`${session.userId}:`));
                    if (isAuthSessionCurrent(session) && !hasPendingForUser) {
                        set({ isSyncing: false });
                    }
                }
            },
        }),
        {
            name: SETTINGS_STORAGE_KEY,
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({
                language: state.language,
                currency: state.currency,
                pushNotifications: state.pushNotifications,
                theme: state.theme,
                timeZone: state.timeZone,
            }),
        }
    )
);
