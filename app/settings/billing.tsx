import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Image, Alert } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { usePaymentMethodStore } from '@/store/usePaymentMethodStore';
import { AddPaymentMethodSheet } from '@/components/AddPaymentMethodSheet';

export default function BillingScreen() {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const { t } = useTranslation();
    const { methods, removeMethod } = usePaymentMethodStore();
    const [showSheet, setShowSheet] = useState(false);

    const handleTapMethod = (id: string, label: string) => {
        Alert.alert(
            label,
            t('billing.delete_confirm'),
            [
                { text: t('billing.cancel'), style: 'cancel' },
                { text: t('billing.delete'), style: 'destructive', onPress: () => removeMethod(id) },
            ],
        );
    };

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
                            onPress={() => setShowSheet(true)}
                            style={{ marginRight: 4, padding: 4 }}
                        >
                            <Ionicons name="add" size={26} color={isDark ? '#ffffff' : '#000000'} />
                        </Pressable>
                    ),
                }}
            />
            <View className="flex-1 bg-neutral-50 dark:bg-black pt-6">
                <ScrollView className="flex-1 px-4">
                    {methods.length === 0 ? (
                        <View className="py-20 items-center px-8">
                            <Ionicons name="card-outline" size={52} color={isDark ? '#3f3f46' : '#d4d4d8'} />
                            <Text className="text-neutral-400 dark:text-neutral-600 text-center mt-4 text-base">
                                {t('billing.empty')}
                            </Text>
                        </View>
                    ) : (
                        <View className="bg-white dark:bg-[#1C1C1E] rounded-2xl overflow-hidden shadow-sm shadow-neutral-200/50 dark:shadow-none border border-neutral-200/50 dark:border-white/10 mb-6">
                            {methods.map((method, index) => {
                                const isLast = index === methods.length - 1;
                                return (
                                    <Pressable
                                        key={method.id}
                                        onPress={() => handleTapMethod(method.id, method.label)}
                                        className={`flex-row items-center justify-between p-4 ${!isLast ? 'border-b border-neutral-100 dark:border-white/5' : ''}`}
                                    >
                                        <View className="flex-row items-center">
                                            <View
                                                className="w-10 h-10 rounded-xl items-center justify-center mr-3"
                                                style={{ backgroundColor: `${method.color}20` }}
                                            >
                                                {method.iconUri ? (
                                                    <Image
                                                        source={{ uri: method.iconUri }}
                                                        style={{ width: 32, height: 32, borderRadius: 8 }}
                                                    />
                                                ) : (
                                                    <Ionicons
                                                        name={(method.iconName ?? 'card-outline') as any}
                                                        size={20}
                                                        color={method.color}
                                                    />
                                                )}
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
                    )}
                </ScrollView>
            </View>

            <AddPaymentMethodSheet visible={showSheet} onClose={() => setShowSheet(false)} />
        </>
    );
}
