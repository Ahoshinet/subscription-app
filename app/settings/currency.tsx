import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Stack, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '@/store/useSettingsStore';
import { Ionicons } from '@expo/vector-icons';

const currencies = [
    { id: 'USD', name: 'US Dollar', symbol: '$' },
    { id: 'JPY', name: 'Japanese Yen', symbol: '¥' },
    { id: 'EUR', name: 'Euro', symbol: '€' },
    { id: 'GBP', name: 'British Pound', symbol: '£' },
];

export default function CurrencyScreen() {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const { t } = useTranslation();
    const router = useRouter();
    const { currency, setCurrency } = useSettingsStore();

    const handleSelect = (id: string) => {
        setCurrency(id);
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
                    title: t('currency.title'),
                    headerBackTitle: ' ',
                    headerStyle: { backgroundColor: isDark ? '#000000' : '#ffffff' },
                    headerTintColor: isDark ? '#ffffff' : '#000000',
                }}
            />
            <View className="flex-1 bg-neutral-50 dark:bg-black pt-6">
                <ScrollView className="flex-1 px-4">
                    <Text className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider ml-4 mb-2">
                        {t('currency.select')}
                    </Text>

                    <View className="bg-white dark:bg-[#1C1C1E] rounded-2xl overflow-hidden shadow-sm shadow-neutral-200/50 dark:shadow-none border border-neutral-200/50 dark:border-white/10 mb-6">
                        {currencies.map((c, index) => {
                            const isSelected = currency === c.id;
                            const isLast = index === currencies.length - 1;

                            return (
                                <Pressable
                                    key={c.id}
                                    onPress={() => handleSelect(c.id)}
                                    style={{ minHeight: 56 }}
                                    className={`flex-row items-center justify-between px-4 ${!isLast ? 'border-b border-neutral-100 dark:border-white/5' : ''}`}
                                >
                                    <View className="flex-row items-center flex-1">
                                        <Text className="text-base font-medium text-neutral-900 dark:text-white mr-2">
                                            {c.id} ({c.symbol})
                                        </Text>
                                        <Text className="text-sm text-neutral-500 dark:text-neutral-400">
                                            {c.name}
                                        </Text>
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
