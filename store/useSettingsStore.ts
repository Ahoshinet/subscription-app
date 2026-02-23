import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Language = 'en' | 'ja';
export type ThemePreference = 'system' | 'light' | 'dark';

interface SettingsState {
    language: Language;
    currency: string;
    pushNotifications: boolean;
    theme: ThemePreference;

    setLanguage: (lang: Language) => void;
    setCurrency: (currency: string) => void;
    setPushNotifications: (enabled: boolean) => void;
    setTheme: (theme: ThemePreference) => void;
}

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set) => ({
            language: 'en', // Default language is English
            currency: 'USD',
            pushNotifications: true,
            theme: 'system',

            setLanguage: (lang) => set({ language: lang }),
            setCurrency: (currency) => set({ currency: currency }),
            setPushNotifications: (enabled) => set({ pushNotifications: enabled }),
            setTheme: (theme) => set({ theme: theme }),
        }),
        {
            name: 'settings-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
