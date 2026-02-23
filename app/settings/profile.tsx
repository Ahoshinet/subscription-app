import React, { useState } from 'react';
import { View, Text, useColorScheme, TextInput, ScrollView, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

export default function ProfileScreen() {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const { t } = useTranslation();
    const router = useRouter();

    const [name, setName] = useState('John Doe');
    const [email, setEmail] = useState('user@example.com');

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <Stack.Screen
                options={{
                    title: t('profile.title'),
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
                            <Text className="text-neutral-900 dark:text-white text-base w-24">{t('profile.name')}</Text>
                            <TextInput
                                className="flex-1 text-base text-neutral-900 dark:text-white"
                                value={name}
                                onChangeText={setName}
                                placeholder={t('profile.name')}
                                placeholderTextColor={isDark ? "#52525B" : "#A1A1AA"}
                            />
                        </View>
                        <View className="p-4 flex-row items-center">
                            <Text className="text-neutral-900 dark:text-white text-base w-24">{t('profile.email')}</Text>
                            <TextInput
                                className="flex-1 text-base text-neutral-900 dark:text-white"
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                placeholder={t('profile.email')}
                                placeholderTextColor={isDark ? "#52525B" : "#A1A1AA"}
                            />
                        </View>
                    </View>

                    <Pressable
                        className="bg-blue-500 rounded-xl p-4 items-center"
                        onPress={() => router.back()}
                    >
                        <Text className="text-white font-bold text-base">
                            {t('profile.save')}
                        </Text>
                    </Pressable>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
