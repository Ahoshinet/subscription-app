import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { settingsApi } from '../lib/api';

export type Language = 'en' | 'ja';
export type ThemePreference = 'system' | 'light' | 'dark';

interface SettingsState {
    language: Language;
    currency: string;
    pushNotifications: boolean;
    theme: ThemePreference;
    isSyncing: boolean;

    setLanguage: (lang: Language) => void;
    setCurrency: (currency: string) => void;
    setPushNotifications: (enabled: boolean) => void;
    setTheme: (theme: ThemePreference) => void;
    syncFromServer: () => Promise<void>;
    syncToServer: (patch: Record<string, unknown>) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set, get) => ({
            language: 'en',
            currency: 'JPY',
            pushNotifications: true,
            theme: 'system',
            isSyncing: false,

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

            syncFromServer: async () => {
                try {
                    set({ isSyncing: true });
                    const settings = await settingsApi.get();
                    set({
                        language: (settings.language as Language) || 'en',
                        currency: settings.currency || 'JPY',
                        pushNotifications: settings.push_notifications ?? true,
                        theme: (settings.theme as ThemePreference) || 'system',
                        isSyncing: false,
                    });
                } catch {
                    set({ isSyncing: false });
                }
            },

            syncToServer: async (patch) => {
                set({ isSyncing: true });
                try {
                    await settingsApi.update(patch as any);
                } catch {
                    // Settings saved locally even if server sync fails
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
            }),
        }
    )
);
