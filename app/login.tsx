import React, { useState, useRef } from 'react';
import { View, Text, TextInput, Pressable, KeyboardAvoidingView, ScrollView, Platform, ActivityIndicator, Alert } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useRouter, Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/useAuthStore';
import { singleLineTextInputStyle } from '../lib/textInputStyles';

export default function LoginScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const { t } = useTranslation();

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const { login, isLoading, error, clearError } = useAuthStore();
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
            if (__DEV__) {
                console.log(`[login] submit: username="${trimmedUsername}" (len=${trimmedUsername.length}), password len=${password.length}`);
            }
            await login({ username: trimmedUsername, password });
            // The Root Layout will handle the redirect once authenticated
            router.replace('/(tabs)');
        } catch (e: any) {
            // Error is handled by the store
        } finally {
            isSubmitting.current = false;
        }
    };

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <Stack.Screen options={{ headerShown: false }} />
            <ScrollView
                className="flex-1 bg-neutral-50 dark:bg-neutral-950"
                contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}
                keyboardShouldPersistTaps="handled"
            >
                <View className="mb-10 items-center">
                    <Text className="text-4xl font-extrabold text-neutral-900 dark:text-white mb-2 tracking-tight">
                        Welcome Back
                    </Text>
                    <Text className="text-neutral-500 dark:text-neutral-400 text-base text-center">
                        {t('login.subtitle')}
                    </Text>
                </View>

                {error && (
                    <View className="bg-red-100 dark:bg-red-900/30 p-4 rounded-xl mb-6 border border-red-200 dark:border-red-900/50">
                        <Text className="text-red-600 dark:text-red-400 text-center">{error}</Text>
                    </View>
                )}

                <View className="space-y-4 mb-6">
                    <View>
                        <Text className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2 ml-1">{t('login.username')}</Text>
                        <TextInput
                            placeholder={t('login.username_placeholder')}
                            placeholderTextColor={isDark ? "#52525B" : "#A1A1AA"}
                            className="w-full h-14 bg-white dark:bg-[#1C1C1E] border border-neutral-200 dark:border-neutral-800 rounded-xl px-4 text-base text-neutral-900 dark:text-white"
                            style={singleLineTextInputStyle}
                            value={username}
                            onChangeText={setUsername}
                            autoCapitalize="none"
                            autoCorrect={false}
                            textContentType="none"
                        />
                    </View>

                    <View>
                        <Text className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2 ml-1">{t('login.password')}</Text>
                        <TextInput
                            placeholder={t('login.password_placeholder')}
                            placeholderTextColor={isDark ? "#52525B" : "#A1A1AA"}
                            className="w-full h-14 bg-white dark:bg-[#1C1C1E] border border-neutral-200 dark:border-neutral-800 rounded-xl px-4 text-base text-neutral-900 dark:text-white"
                            style={singleLineTextInputStyle}
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                            autoCapitalize="none"
                            autoCorrect={false}
                            textContentType="none"
                        />
                    </View>
                </View>

                <Pressable
                    onPress={handleLogin}
                    disabled={isLoading}
                    className="w-full bg-blue-500 rounded-xl py-4 items-center mb-6 shadow-lg shadow-blue-500/30 active:opacity-80"
                >
                    {isLoading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text className="text-white font-bold text-lg">{t('login.submit')}</Text>
                    )}
                </Pressable>

                <View className="flex-row justify-center items-center">
                    <Text className="text-neutral-500 dark:text-neutral-400">{t('login.no_account')}</Text>
                    <Pressable onPress={() => router.push('/register')}>
                        <Text className="text-blue-500 font-bold">{t('login.register_link')}</Text>
                    </Pressable>
                </View>

            </ScrollView>
        </KeyboardAvoidingView>
    );
}
