import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

const mockPaymentMethods = [
    { id: '1', type: 'Visa', last4: '4242', icon: 'card' },
    { id: '2', type: 'Mastercard', last4: '1234', icon: 'card' },
];

export default function BillingScreen() {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const { t } = useTranslation();

    return (
        <>
            <Stack.Screen
                options={{
                    title: t('billing.title'),
                    headerBackTitle: ' ',
                    headerStyle: { backgroundColor: isDark ? '#000000' : '#ffffff' },
                    headerTintColor: isDark ? '#ffffff' : '#000000',
                }}
            />
            <View className="flex-1 bg-neutral-50 dark:bg-black pt-6">
                <ScrollView className="flex-1 px-4">
                    <View className="bg-white dark:bg-[#1C1C1E] rounded-2xl overflow-hidden shadow-sm shadow-neutral-200/50 dark:shadow-none border border-neutral-200/50 dark:border-white/10 mb-6">
                        {mockPaymentMethods.map((method, index) => {
                            const isLast = index === mockPaymentMethods.length - 1;

                            return (
                                <Pressable
                                    key={method.id}
                                    className={`flex-row items-center justify-between p-4 ${!isLast ? 'border-b border-neutral-100 dark:border-white/5' : ''}`}
                                >
                                    <View className="flex-row items-center">
                                        <View className="w-10 h-8 rounded bg-neutral-100 dark:bg-white/10 items-center justify-center mr-3">
                                            <Ionicons name={method.icon as any} size={20} color="#808080" />
                                        </View>
                                        <Text className="text-base font-medium text-neutral-900 dark:text-white">
                                            {method.type} •••• {method.last4}
                                        </Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                                </Pressable>
                            );
                        })}
                    </View>

                    <Pressable
                        className="bg-white dark:bg-[#1C1C1E] rounded-2xl p-4 flex-row items-center justify-center shadow-sm shadow-neutral-200/50 dark:shadow-none border border-neutral-200/50 dark:border-white/10"
                    >
                        <Ionicons name="add-circle-outline" size={20} color="#3B82F6" className="mr-2" />
                        <Text className="text-blue-500 font-medium text-base ml-2">
                            {t('billing.add_new')}
                        </Text>
                    </Pressable>
                </ScrollView>
            </View>
        </>
    );
}
