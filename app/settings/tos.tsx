import React from 'react';
import { View, Text, ScrollView, Linking, Pressable } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

const SECTIONS = [
    { title: 'tos.s1_title', body: 'tos.s1_body' },
    { title: 'tos.s2_title', body: 'tos.s2_body' },
    { title: 'tos.s3_title', body: 'tos.s3_body' },
    { title: 'tos.s4_title', body: 'tos.s4_body' },
    { title: 'tos.s5_title', body: 'tos.s5_body' },
    { title: 'tos.s6_title', body: 'tos.s6_body' },
    { title: 'tos.s7_title', body: 'tos.s7_body' },
    { title: 'tos.s8_title', body: 'tos.s8_body' },
    { title: 'tos.s9_title', body: 'tos.s9_body' },
    { title: 'tos.s10_title', body: 'tos.s10_body' },
    { title: 'tos.s11_title', body: 'tos.s11_body' },
] as const;

const CONTACT_URL = 'https://corp.daruks.com/contact';

export default function TosScreen() {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const { t } = useTranslation();

    return (
        <>
            <Stack.Screen
                options={{
                    title: t('tos.title'),
                    headerBackTitle: ' ',
                    headerStyle: { backgroundColor: isDark ? '#0A0A0A' : '#ffffff' },
                    headerTintColor: isDark ? '#ffffff' : '#000000',
                }}
            />
            <View className="flex-1 bg-neutral-50 dark:bg-neutral-950 pt-6">
                <ScrollView className="flex-1 px-6">
                    <Text className="text-2xl font-bold text-neutral-900 dark:text-white mb-1">
                        {t('tos.title')}
                    </Text>
                    <Text className="text-xs text-neutral-400 dark:text-neutral-500 mb-6">
                        {t('tos.effective_date')}
                    </Text>

                    <View className="bg-white dark:bg-[#1C1C1E] rounded-2xl shadow-sm shadow-neutral-200/50 dark:shadow-none border border-neutral-200/50 dark:border-white/10 mb-8 overflow-hidden">
                        {SECTIONS.map((section, index) => (
                            <View
                                key={section.title}
                                className={`px-6 py-5 ${index < SECTIONS.length - 1 ? 'border-b border-neutral-100 dark:border-white/5' : ''}`}
                            >
                                <Text className="text-sm font-bold text-neutral-900 dark:text-white mb-2">
                                    {t(section.title)}
                                </Text>
                                {section.title === 'tos.s11_title' ? (
                                    <View>
                                        <Text className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed mb-2">
                                            {t(section.body).split(CONTACT_URL)[0]}
                                        </Text>
                                        <Pressable onPress={() => Linking.openURL(CONTACT_URL)}>
                                            <Text className="text-sm text-blue-500 dark:text-blue-400 leading-relaxed">
                                                {CONTACT_URL}
                                            </Text>
                                        </Pressable>
                                    </View>
                                ) : (
                                    <Text className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
                                        {t(section.body)}
                                    </Text>
                                )}
                            </View>
                        ))}
                    </View>
                </ScrollView>
            </View>
        </>
    );
}
