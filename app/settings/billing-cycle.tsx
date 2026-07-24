import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAddFormStore, BILLING_CYCLES } from '../../store/useAddFormStore';

export default function BillingCyclePickerScreen() {
    const { t } = useTranslation();
    const router = useRouter();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const { billingCycle, setBillingCycle } = useAddFormStore();

    const handleSelect = (value: string) => {
        setBillingCycle(value);
        router.back();
    };

    return (
        <View className="flex-1 bg-[#F2F2F7] dark:bg-neutral-950 pt-6">
            <Stack.Screen
                options={{
                    title: t('billing_cycle.title'),
                    headerBackTitle: ' ',
                    headerStyle: { backgroundColor: isDark ? '#0A0A0A' : '#F2F2F7' },
                    headerTintColor: isDark ? '#FFFFFF' : '#000000',
                    headerShadowVisible: false,
                }}
            />
            <View className="px-4">
                <View className="bg-white dark:bg-[#1C1C1E] rounded-xl overflow-hidden">
                    {BILLING_CYCLES.map((cycle, index) => (
                        <Pressable
                            key={cycle}
                            onPress={() => handleSelect(cycle)}
                            className={`px-4 py-3.5 flex-row items-center justify-between ${index < BILLING_CYCLES.length - 1 ? 'border-b border-neutral-200 dark:border-neutral-800' : ''
                                }`}
                            style={{ minHeight: 52 }}
                        >
                            <Text className="text-neutral-900 dark:text-white text-base">{t(`billing_cycle.${cycle}`)}</Text>
                            {billingCycle === cycle && (
                                <Ionicons name="checkmark" size={22} color="#3B82F6" />
                            )}
                        </Pressable>
                    ))}
                </View>
            </View>
        </View>
    );
}
