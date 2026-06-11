import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as WebBrowser from 'expo-web-browser';
import 'react-native-reanimated';
import '../global.css';

WebBrowser.maybeCompleteAuthSession();

import { useColorScheme as useRNColorScheme } from 'react-native';
import { useColorScheme as useNativeWindColorScheme } from 'nativewind';
import { useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { usePaymentMethodStore } from '@/store/usePaymentMethodStore';
import { usePaidyStore } from '@/store/usePaidyStore';
import { ensureApiReachable } from '@/lib/api';
import '@/i18n';
import { useTranslation } from 'react-i18next';

export const unstable_settings = {
    anchor: '(tabs)',
};

export default function RootLayout() {
    const systemColorScheme = useRNColorScheme();
    const { setColorScheme } = useNativeWindColorScheme();
    const { isAuthenticated, isInitializing, checkAuth } = useAuthStore();
    const { language, theme } = useSettingsStore();
    const { syncFromServer: syncPaymentMethods } = usePaymentMethodStore();
    const { loadFromServer: loadPaidy } = usePaidyStore();
    const { i18n } = useTranslation();

    // Apply user's theme preference
    const effectiveColorScheme = theme === 'system' ? systemColorScheme : theme;
    const isDark = effectiveColorScheme === 'dark';
    const screenBg = isDark ? '#0a0a0a' : '#fafafa';
    const segments = useSegments();
    const router = useRouter();

    useEffect(() => {
        ensureApiReachable().then(() => checkAuth());
    }, []);

    useEffect(() => {
        // Ensure the language specified in settings is applied
        if (i18n.language !== language) {
            i18n.changeLanguage(language);
        }
    }, [language, i18n]);

    useEffect(() => {
        // Sync NativeWind color scheme with settings
        setColorScheme(theme === 'system' ? (systemColorScheme === 'dark' ? 'dark' : 'light') : theme);
    }, [theme, systemColorScheme]);

    useEffect(() => {
        if (isInitializing) return;

        const inAuthGroup = segments[0] === 'login' || segments[0] === 'register';

        if (!isAuthenticated && !inAuthGroup) {
            router.replace('/login');
        } else if (isAuthenticated && inAuthGroup) {
            router.replace('/(tabs)');
        }
    }, [isAuthenticated, isInitializing, segments]);

    // Server sync runs once per auth session — keying on segments would
    // re-trigger it on every route change and eat into the rate limit.
    useEffect(() => {
        if (isInitializing || !isAuthenticated) return;
        syncPaymentMethods();
        loadPaidy();
    }, [isAuthenticated, isInitializing]);

    if (isInitializing) {
        // Return null or a splash screen while checking token
        return null;
    }

    return (
        <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
            <Stack screenOptions={{ headerBackTitle: ' ' }}>
                <Stack.Screen name="(tabs)" options={{ headerShown: false, title: '' }} />
                <Stack.Screen name="login" options={{ headerShown: false, contentStyle: { backgroundColor: screenBg } }} />
                <Stack.Screen name="register" options={{ headerShown: false, contentStyle: { backgroundColor: screenBg } }} />
                <Stack.Screen name="add" options={{ presentation: 'modal' }} />
                <Stack.Screen name="detail" />
                <Stack.Screen name="edit" options={{ presentation: 'modal' }} />
                <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
                <Stack.Screen name="paidy-detail" options={{ presentation: 'modal', headerShown: false }} />
                <Stack.Screen name="image-crop" options={{ headerShown: false, animation: 'slide_from_bottom' }} />
            </Stack>
            <StatusBar style="auto" />
        </ThemeProvider>
    );
}
