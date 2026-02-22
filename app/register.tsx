import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, useColorScheme, KeyboardAvoidingView, ScrollView, Platform, ActivityIndicator, Alert } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/useAuthStore';

export default function RegisterScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const { register, isLoading, error, clearError } = useAuthStore();

    const handleRegister = async () => {
        if (!username || !password) {
            Alert.alert('入力エラー', 'ユーザー名とパスワードを入力してください');
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert('入力エラー', 'パスワードが一致しません');
            return;
        }

        clearError();
        try {
            await register({ username, password });
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
            <Stack.Screen
                options={{
                    headerShown: true,
                    headerTransparent: true,
                    title: '',
                    headerLeft: () => (
                        <Pressable onPress={() => router.back()} style={{ width: 40, height: 40, borderRadius: 20, marginLeft: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: isDark ? 'rgba(38,38,38,0.5)' : 'rgba(229,229,229,0.5)' }}>
                            <Ionicons name="arrow-back" size={24} color={isDark ? "white" : "black"} />
                        </Pressable>
                    )
                }}
            />
            <ScrollView
                className="flex-1 bg-neutral-50 dark:bg-neutral-950"
                contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24, paddingTop: 100 }}
                keyboardShouldPersistTaps="handled"
            >
                <View className="mb-10 items-center">
                    <Text className="text-4xl font-extrabold text-neutral-900 dark:text-white mb-2 tracking-tight">
                        Create Account
                    </Text>
                    <Text className="text-neutral-500 dark:text-neutral-400 text-base text-center">
                        新しいアカウントを作成して管理をはじめましょう
                    </Text>
                </View>

                {error && (
                    <View className="bg-red-100 dark:bg-red-900/30 p-4 rounded-xl mb-6 border border-red-200 dark:border-red-900/50">
                        <Text className="text-red-600 dark:text-red-400 text-center">{error}</Text>
                    </View>
                )}

                <View className="space-y-4 mb-8">
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
                            className="w-full bg-white dark:bg-[#1C1C1E] border border-neutral-200 dark:border-neutral-800 rounded-xl px-4 py-4 text-base text-neutral-900 dark:text-white"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                    </View>

                    <View>
                        <Text className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2 ml-1">パスワード (確認)</Text>
                        <TextInput
                            placeholder="もう一度パスワードを入力"
                            placeholderTextColor={isDark ? "#52525B" : "#A1A1AA"}
                            className="w-full bg-white dark:bg-[#1C1C1E] border border-neutral-200 dark:border-neutral-800 rounded-xl px-4 py-4 text-base text-neutral-900 dark:text-white"
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                    </View>
                </View>

                <Pressable
                    onPress={handleRegister}
                    disabled={isLoading}
                    className="w-full bg-blue-500 rounded-xl py-4 items-center mb-6 shadow-lg shadow-blue-500/30 active:opacity-80"
                >
                    {isLoading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text className="text-white font-bold text-lg">サインアップ</Text>
                    )}
                </Pressable>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
