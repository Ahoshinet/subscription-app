import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, useColorScheme, KeyboardAvoidingView, ScrollView, Platform, ActivityIndicator, Alert } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useAuthStore } from '../store/useAuthStore';

export default function LoginScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const { login, isLoading, error, clearError } = useAuthStore();

    const handleLogin = async () => {
        if (!username || !password) {
            Alert.alert('入力エラー', 'ユーザー名とパスワードを入力してください');
            return;
        }

        clearError();
        try {
            await login({ username, password });
            // The Root Layout will handle the redirect once authenticated
            router.replace('/(tabs)');
        } catch (e: any) {
            // Error is handled by the store
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
                        サブスクの世界へようこそ
                    </Text>
                </View>

                {error && (
                    <View className="bg-red-100 dark:bg-red-900/30 p-4 rounded-xl mb-6 border border-red-200 dark:border-red-900/50">
                        <Text className="text-red-600 dark:text-red-400 text-center">{error}</Text>
                    </View>
                )}

                <View className="space-y-4 mb-6">
                    <View>
                        <Text className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2 ml-1">ユーザー名</Text>
                        <TextInput
                            placeholder="ユーザー名を入力"
                            placeholderTextColor={isDark ? "#52525B" : "#A1A1AA"}
                            className="w-full bg-white dark:bg-[#1C1C1E] border border-neutral-200 dark:border-neutral-800 rounded-xl px-4 py-4 text-base text-neutral-900 dark:text-white"
                            value={username}
                            onChangeText={setUsername}
                            autoCapitalize="none"
                        />
                    </View>

                    <View>
                        <Text className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2 ml-1">パスワード</Text>
                        <TextInput
                            placeholder="パスワードを入力"
                            placeholderTextColor={isDark ? "#52525B" : "#A1A1AA"}
                            className="w-full bg-white dark:bg-[#1C1C1E] border border-neutral-200 dark:border-neutral-800 rounded-xl px-4 py-4 text-neutral-900 dark:text-white"
                            style={{ fontSize: 16 }}
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
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
                        <Text className="text-white font-bold text-lg">ログイン</Text>
                    )}
                </Pressable>

                <View className="flex-row justify-center items-center">
                    <Text className="text-neutral-500 dark:text-neutral-400">アカウントをお持ちでないですか？ </Text>
                    <Pressable onPress={() => router.push('/register')}>
                        <Text className="text-blue-500 font-bold">新規登録</Text>
                    </Pressable>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
