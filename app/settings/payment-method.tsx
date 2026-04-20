import React, { useState } from 'react';
import { View, Text, Pressable, useColorScheme, Image } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAddFormStore } from '../../store/useAddFormStore';
import { usePaymentMethodStore } from '../../store/usePaymentMethodStore';
import { AddPaymentMethodSheet } from '../../components/AddPaymentMethodSheet';

export default function PaymentMethodPickerScreen() {
    const { t } = useTranslation();
    const router = useRouter();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const [showSheet, setShowSheet] = useState(false);
    const { paymentMethod, setPaymentMethod } = useAddFormStore();
    const { methods } = usePaymentMethodStore();

    const handleSelect = (id: string) => {
        setPaymentMethod(id);
        router.back();
    };

    return (
        <>
            <View className="flex-1 bg-[#F2F2F7] dark:bg-black pt-6">
                <Stack.Screen
                    options={{
                        title: t('payment_method.title'),
                        headerBackTitle: ' ',
                        headerStyle: { backgroundColor: isDark ? '#1C1C1E' : '#F2F2F7' },
                        headerTintColor: isDark ? '#FFFFFF' : '#000000',
                        headerShadowVisible: false,
                        headerRight: () => (
                            <Pressable
                                onPress={() => setShowSheet(true)}
                                style={{ marginRight: 4, padding: 4 }}
                            >
                                <Ionicons name="add" size={26} color={isDark ? '#FFFFFF' : '#000000'} />
                            </Pressable>
                        ),
                    }}
                />
                <View className="px-4">
                    {methods.length === 0 ? (
                        <View key="picker-empty" className="py-14 items-center px-6">
                            <Ionicons name="card-outline" size={44} color={isDark ? '#3f3f46' : '#d4d4d8'} />
                            <Text className="text-neutral-400 dark:text-neutral-600 text-center mt-4 text-base">
                                {t('billing.empty')}
                            </Text>
                            <Pressable
                                onPress={() => setShowSheet(true)}
                                className="mt-5 bg-white dark:bg-[#1C1C1E] border border-neutral-200 dark:border-neutral-700 px-4 py-2 rounded-full"
                            >
                                <Text className="text-neutral-900 dark:text-white text-sm font-semibold">
                                    {t('billing.add_new')}
                                </Text>
                            </Pressable>
                        </View>
                    ) : (
                        <View key="picker-list" className="bg-white dark:bg-[#1C1C1E] rounded-xl overflow-hidden">
                            {methods.map((method, index) => (
                                <Pressable
                                    key={method.id}
                                    onPress={() => handleSelect(method.id)}
                                    className={`px-4 py-3.5 flex-row items-center justify-between ${
                                        index < methods.length - 1 ? 'border-b border-neutral-200 dark:border-neutral-800' : ''
                                    }`}
                                >
                                    <View className="flex-row items-center">
                                        <View
                                            className="w-8 h-8 rounded-lg items-center justify-center mr-3"
                                            style={{ backgroundColor: `${method.color}20` }}
                                        >
                                            {method.iconUri ? (
                                                <Image
                                                    source={{ uri: method.iconUri }}
                                                    style={{ width: 26, height: 26, borderRadius: 6 }}
                                                />
                                            ) : (
                                                <Ionicons
                                                    name={(method.iconName ?? 'card-outline') as any}
                                                    size={16}
                                                    color={method.color}
                                                />
                                            )}
                                        </View>
                                        <View>
                                            <Text className="text-neutral-900 dark:text-white text-base">
                                                {method.label}
                                            </Text>
                                            {method.memo ? (
                                                <Text className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">
                                                    {method.memo}
                                                </Text>
                                            ) : null}
                                        </View>
                                    </View>
                                    {paymentMethod === method.id && (
                                        <Ionicons name="checkmark" size={22} color="#3B82F6" />
                                    )}
                                </Pressable>
                            ))}
                        </View>
                    )}
                </View>
            </View>

            <AddPaymentMethodSheet visible={showSheet} onClose={() => setShowSheet(false)} />
        </>
    );
}
