import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, Pressable, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Stack, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/useAuthStore';
import { authApi } from '@/lib/api';
import { singleLineTextInputStyle } from '@/lib/textInputStyles';

export default function ProfileScreen() {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const { t } = useTranslation();
    const router = useRouter();
    const { user } = useAuthStore();

    const [name, setName] = useState(user?.username ?? '');
    const [isSaving, setIsSaving] = useState(false);

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <Stack.Screen
                options={{
                    title: t('profile.title'),
                    headerBackTitle: ' ',
                    headerStyle: { backgroundColor: isDark ? '#0A0A0A' : '#ffffff' },
                    headerTintColor: isDark ? '#ffffff' : '#000000',
                }}
            />
            <ScrollView
                className="flex-1 bg-neutral-50 dark:bg-neutral-950 pt-6"
                keyboardDismissMode="on-drag"
                keyboardShouldPersistTaps="handled"
            >
                <View className="px-4">
                    <View className="bg-white dark:bg-[#1C1C1E] rounded-xl overflow-hidden shadow-sm shadow-neutral-200/50 dark:shadow-none border border-neutral-200/50 dark:border-white/10 mb-6">
                        <View className="p-4 flex-row items-center">
                            <Text className="text-neutral-900 dark:text-white text-base w-24">{t('profile.name')}</Text>
                            <TextInput
                                className="flex-1 text-base text-neutral-900 dark:text-white"
                                style={singleLineTextInputStyle}
                                value={name}
                                onChangeText={setName}
                                placeholder={t('profile.name')}
                                placeholderTextColor={isDark ? "#52525B" : "#A1A1AA"}
                                autoCapitalize="none"
                            />
                        </View>
                    </View>

                    <Pressable
                        className="items-center py-4 rounded-xl bg-white dark:bg-[#1C1C1E] border border-neutral-200/50 dark:border-white/10"
                        style={{ opacity: isSaving ? 0.6 : 1 }}
                        disabled={isSaving}
                        onPress={async () => {
                            if (!name.trim()) return;
                            setIsSaving(true);
                            try {
                                const updated = await authApi.updateProfile({ username: name.trim() });
                                useAuthStore.setState({ user: updated });
                                router.back();
                            } catch (err: any) {
                                Alert.alert('Error', err.message || 'Failed to update profile');
                            } finally {
                                setIsSaving(false);
                            }
                        }}
                    >
                        {isSaving ? (
                            <ActivityIndicator color="#3B82F6" />
                        ) : (
                            <Text className="text-blue-500 font-bold text-base">
                                {t('profile.save')}
                            </Text>
                        )}
                    </Pressable>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
