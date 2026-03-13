import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSettingsStore, Language } from '@/store/useSettingsStore';

const languages = [
    { id: 'en', name: 'English', localName: 'English' },
    { id: 'ja', name: 'Japanese', localName: '日本語' },
];

export default function LanguageSettingsScreen() {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const router = useRouter();
    const { t, i18n } = useTranslation();
    const { language, setLanguage } = useSettingsStore();

    const handleSelect = (id: string) => {
        setLanguage(id as Language);
        i18n.changeLanguage(id);
        // Add a slight delay before going back to let the user see the checkmark
        setTimeout(() => {
            if (router.canGoBack()) {
                router.back();
            } else {
                router.navigate('/(tabs)/settings');
            }
        }, 250);
    };

    return (
        <>
            <Stack.Screen
                options={{
                    title: t('settings.language'),
                    headerBackTitle: ' ',
                    // Use standard iOS header colors
                    headerStyle: { backgroundColor: isDark ? '#000000' : '#ffffff' },
                    headerTintColor: isDark ? '#ffffff' : '#000000',
                }}
            />

            <View className="flex-1 bg-neutral-50 dark:bg-black pt-6">
                <ScrollView className="flex-1 px-4">

                    <Text className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider ml-4 mb-2">
                        Select Language
                    </Text>

                    <View className="rounded-2xl overflow-hidden shadow-sm shadow-neutral-200/50 dark:shadow-none border border-neutral-200/50 dark:border-white/10">
                        {languages.map((lang, index) => {
                            const isSelected = language === lang.id;
                            const isLast = index === languages.length - 1;

                            return (
                                <Pressable
                                    key={lang.id}
                                    onPress={() => handleSelect(lang.id)}
                                    style={{ minHeight: 56 }}
                                    className={`
                    bg-white dark:bg-[#1C1C1E] flex-row items-center justify-between px-4 py-3
                    ${!isLast ? 'border-b border-neutral-100 dark:border-white/5' : ''}
                  `}
                                >
                                    <View className="flex-1">
                                        <Text className="text-base font-medium text-neutral-900 dark:text-white">
                                            {lang.localName}
                                        </Text>
                                        {lang.name !== lang.localName && (
                                            <Text className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
                                                {lang.name}
                                            </Text>
                                        )}
                                    </View>

                                    {isSelected && (
                                        <Ionicons name="checkmark" size={24} color="#3B82F6" />
                                    )}
                                </Pressable>
                            );
                        })}
                    </View>

                </ScrollView>
            </View>
        </>
    );
}
