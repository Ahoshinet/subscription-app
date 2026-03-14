import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

const DEFAULT_PAYMENT_METHODS = [
    { id: 'paypal',       label: 'PayPal',         icon: 'logo-paypal',  color: '#003087' },
    { id: 'apple-pay',    label: 'Apple Pay',       icon: 'logo-apple',   color: '#000000' },
    { id: 'app-store',    label: 'App Store決済',   icon: 'logo-apple',   color: '#0D84F1' },
    { id: 'google-pay',   label: 'Google Pay',      icon: 'logo-google',  color: '#4285F4' },
    { id: 'google-play',  label: 'Google Play決済', icon: 'logo-google',  color: '#01875F' },
    { id: 'paidy',        label: 'Paidy',           icon: 'card-outline', color: '#6C47FF' },
    { id: 'amazon-pay',   label: 'Amazon Pay',      icon: 'cart-outline', color: '#FF9900' },
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
                    headerRight: () => (
                        <Pressable
                            onPress={() => {/* TODO: add payment method */}}
                            style={{ marginRight: 4, padding: 4 }}
                        >
                            <Ionicons name="add" size={26} color={isDark ? '#ffffff' : '#000000'} />
                        </Pressable>
                    ),
                }}
            />
            <View className="flex-1 bg-neutral-50 dark:bg-black pt-6">
                <ScrollView className="flex-1 px-4">
                    <Text className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider ml-1 mb-2">
                        {t('billing.default_methods')}
                    </Text>
                    <View className="bg-white dark:bg-[#1C1C1E] rounded-2xl overflow-hidden shadow-sm shadow-neutral-200/50 dark:shadow-none border border-neutral-200/50 dark:border-white/10 mb-6">
                        {DEFAULT_PAYMENT_METHODS.map((method, index) => {
                            const isLast = index === DEFAULT_PAYMENT_METHODS.length - 1;
                            return (
                                <Pressable
                                    key={method.id}
                                    className={`flex-row items-center justify-between p-4 ${!isLast ? 'border-b border-neutral-100 dark:border-white/5' : ''}`}
                                >
                                    <View className="flex-row items-center">
                                        <View
                                            className="w-10 h-10 rounded-xl items-center justify-center mr-3"
                                            style={{ backgroundColor: `${method.color}20` }}
                                        >
                                            <Ionicons name={method.icon as any} size={20} color={method.color} />
                                        </View>
                                        <Text className="text-base font-medium text-neutral-900 dark:text-white">
                                            {method.label}
                                        </Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                                </Pressable>
                            );
                        })}
                    </View>
                </ScrollView>
            </View>
        </>
    );
}
