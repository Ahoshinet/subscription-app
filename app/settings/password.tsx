import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, Pressable, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Stack, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { authApi } from '@/lib/api';

export default function PasswordScreen() {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const { t } = useTranslation();
    const router = useRouter();

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <Stack.Screen
                options={{
                    title: t('password.title'),
                    headerBackTitle: ' ',
                    headerStyle: { backgroundColor: isDark ? '#000000' : '#ffffff' },
                    headerTintColor: isDark ? '#ffffff' : '#000000',
                }}
            />
            <ScrollView
                className="flex-1 bg-neutral-50 dark:bg-black pt-6"
                keyboardDismissMode="on-drag"
                keyboardShouldPersistTaps="handled"
            >
                <View className="px-4">
                    <View className="bg-white dark:bg-[#1C1C1E] rounded-xl overflow-hidden shadow-sm shadow-neutral-200/50 dark:shadow-none border border-neutral-200/50 dark:border-white/10 mb-6">
                        <View className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex-row items-center">
                            <TextInput
                                className="flex-1 text-base text-neutral-900 dark:text-white"
                                value={currentPassword}
                                onChangeText={setCurrentPassword}
                                secureTextEntry
                                placeholder={t('password.current')}
                                placeholderTextColor={isDark ? "#52525B" : "#A1A1AA"}
                            />
                        </View>
                        <View className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex-row items-center">
                            <TextInput
                                className="flex-1 text-base text-neutral-900 dark:text-white"
                                value={newPassword}
                                onChangeText={setNewPassword}
                                secureTextEntry
                                placeholder={t('password.new')}
                                placeholderTextColor={isDark ? "#52525B" : "#A1A1AA"}
                            />
                        </View>
                        <View className="p-4 flex-row items-center">
                            <TextInput
                                className="flex-1 text-base text-neutral-900 dark:text-white"
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry
                                placeholder={t('password.confirm')}
                                placeholderTextColor={isDark ? "#52525B" : "#A1A1AA"}
                            />
                        </View>
                    </View>

                    <Pressable
                        className="bg-blue-500 rounded-xl p-4 items-center"
                        disabled={isSaving}
                        onPress={async () => {
                            if (newPassword !== confirmPassword) {
                                Alert.alert('Error', 'New passwords do not match');
                                return;
                            }
                            if (newPassword.length < 8) {
                                Alert.alert('Error', 'Password must be at least 8 characters');
                                return;
                            }
                            setIsSaving(true);
                            try {
                                await authApi.changePassword({
                                    current_password: currentPassword,
                                    new_password: newPassword,
                                });
                                Alert.alert('Success', 'Password updated successfully');
                                router.back();
                            } catch (err: any) {
                                Alert.alert('Error', err.message || 'Failed to update password');
                            } finally {
                                setIsSaving(false);
                            }
                        }}
                    >
                        {isSaving ? (
                            <ActivityIndicator color="#ffffff" />
                        ) : (
                            <Text className="text-white font-bold text-base">
                                {t('password.update')}
                            </Text>
                        )}
                    </Pressable>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
