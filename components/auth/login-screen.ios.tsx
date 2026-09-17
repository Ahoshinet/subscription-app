import React, { useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { AUTH_DARK_BACKGROUND } from '@/constants/auth-theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@/store/useAuthStore';
import { getErrorMessage } from '@/lib/errors';
import { singleLineTextInputStyle } from '@/lib/textInputStyles';

// iOS login screen: full-black system-style surface, a single borderless
// grouped card for the fields (matching the iOS Settings row conventions),
// and the native iOS accent color for the primary action and link.
export default function LoginScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const { t } = useTranslation();

    const backgroundColor = isDark ? AUTH_DARK_BACKGROUND : '#F2F2F7';
    const accent = isDark ? '#0A84FF' : '#007AFF';
    const secondaryText = isDark ? '#8E8E93' : '#6D6D72';
    const placeholderColor = isDark ? '#636366' : '#AEAEB2';

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const { login, isLoading, clearError } = useAuthStore();
    const isSubmitting = useRef(false);

    const handleLogin = async () => {
        if (isSubmitting.current) return;
        const trimmedUsername = username.trim();
        if (!trimmedUsername || !password) {
            Alert.alert(t('common.input_error'), t('login.error_required'));
            return;
        }

        isSubmitting.current = true;
        clearError();
        try {
            await login({ username: trimmedUsername, password });
            // The Root Layout will handle the redirect once authenticated
            router.replace('/(tabs)');
        } catch (error: unknown) {
            Alert.alert(
                t('login.error_title'),
                getErrorMessage(error, t('login.error_failed')),
            );
            clearError();
        } finally {
            isSubmitting.current = false;
        }
    };

    return (
        <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor }} testID="ios-login-screen">
            <Stack.Screen options={{ headerShown: false }} />
            <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
                <ScrollView
                    contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}
                    keyboardShouldPersistTaps="handled"
                >
                    <View className="mb-10 items-center">
                        <Text className="text-[34px] font-bold text-black dark:text-white mb-2 tracking-tight">
                            {t('login.title')}
                        </Text>
                        <Text style={{ color: secondaryText }} className="text-base text-center">
                            {t('login.subtitle')}
                        </Text>
                    </View>

                    <View
                        className="bg-white dark:bg-[#1C1C1E] rounded-2xl overflow-hidden mb-6"
                        testID="ios-login-fields"
                    >
                        <View
                            className="px-4 h-14 justify-center border-b border-[rgba(60,60,67,0.29)] dark:border-[rgba(84,84,88,0.65)]"
                        >
                            <TextInput
                                placeholder={t('login.username_placeholder')}
                                placeholderTextColor={placeholderColor}
                                className="text-base text-black dark:text-white"
                                style={singleLineTextInputStyle}
                                value={username}
                                onChangeText={setUsername}
                                autoCapitalize="none"
                                autoCorrect={false}
                                textContentType="none"
                                testID="ios-login-username"
                            />
                        </View>
                        <View className="px-4 h-14 justify-center">
                            <TextInput
                                placeholder={t('login.password_placeholder')}
                                placeholderTextColor={placeholderColor}
                                className="text-base text-black dark:text-white"
                                style={singleLineTextInputStyle}
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                                autoCapitalize="none"
                                autoCorrect={false}
                                textContentType="none"
                                testID="ios-login-password"
                            />
                        </View>
                    </View>

                    <Pressable
                        onPress={() => void handleLogin()}
                        disabled={isLoading}
                        style={{ backgroundColor: accent }}
                        className="w-full rounded-2xl py-4 items-center mb-6 active:opacity-80"
                        testID="ios-login-submit"
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text className="text-white font-semibold text-lg">{t('login.submit')}</Text>
                        )}
                    </Pressable>

                    <View className="flex-row justify-center items-center">
                        <Text style={{ color: secondaryText }}>{t('login.no_account')}</Text>
                        <Pressable onPress={() => router.push('/register')}>
                            <Text style={{ color: accent }} className="font-semibold">{t('login.register_link')}</Text>
                        </Pressable>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
