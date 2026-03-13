import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

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
                    headerStyle: { backgroundColor: isDark ? '#000000' : '#ffffff' },
                    headerTintColor: isDark ? '#ffffff' : '#000000',
                }}
            />
            <View className="flex-1 bg-neutral-50 dark:bg-black pt-6">
                <ScrollView className="flex-1 px-6">
                    <Text className="text-2xl font-bold text-neutral-900 dark:text-white mb-6">
                        {t('tos.title')}
                    </Text>

                    <View className="bg-white dark:bg-[#1C1C1E] p-6 rounded-2xl shadow-sm shadow-neutral-200/50 dark:shadow-none border border-neutral-200/50 dark:border-white/10 mb-8">
                        <Text className="text-base text-neutral-700 dark:text-neutral-300 leading-relaxed mb-6">
                            {t('tos.intro')}
                        </Text>
                        <Text className="text-base text-neutral-700 dark:text-neutral-300 leading-relaxed pb-2">
                            {t('tos.data_handling')}
                        </Text>
                    </View>
                </ScrollView>
            </View>
        </>
    );
}
