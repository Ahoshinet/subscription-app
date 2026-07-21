import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { settingsApi } from '../lib/api';
import { CurrencyId, getSystemCurrency } from '../lib/currency';
import { getDeviceTimeZone } from '../lib/timeZone';

export type Language = 'en' | 'ja';
export type ThemePreference = 'system' | 'light' | 'dark';

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
    syncToServer: (patch: Record<string, unknown>) => Promise<void>;
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
                get().syncToServer({ language: lang });
            },
            setCurrency: (currency) => {
                set({ currency });
                get().syncToServer({ currency });
            },
            setPushNotifications: (enabled) => {
                set({ pushNotifications: enabled });
                get().syncToServer({ push_notifications: enabled });
            },
            setTheme: (theme) => {
                set({ theme });
                get().syncToServer({ theme });
            },
            setTimeZone: (timeZone) => {
                set({ timeZone });
                get().syncToServer({ time_zone: timeZone });
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
                await useSettingsStore.persist.clearStorage();
            },

            syncFromServer: async () => {
                try {
                    set({ isSyncing: true });
                    const settings = await settingsApi.get();
                    set({
                        language: (settings.language as Language) || 'en',
                        currency: (settings.currency as CurrencyId) || getSystemCurrency(),
                        pushNotifications: settings.push_notifications ?? true,
                        theme: (settings.theme as ThemePreference) || 'system',
                        timeZone: settings.time_zone || getDeviceTimeZone(),
                        isSyncing: false,
                    });
                } catch {
                    set({ isSyncing: false, syncError: true });
                }
            },

            syncToServer: async (patch) => {
                set({ isSyncing: true });
                try {
                    await settingsApi.update(patch as any);
                } catch {
                    set({ syncError: true });
                } finally {
                    set({ isSyncing: false });
                }
            },
        }),
        {
            name: 'settings-storage',
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
