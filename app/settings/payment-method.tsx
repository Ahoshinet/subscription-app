import React, { useState } from 'react';
import { Platform, View, Text, Pressable, Image } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAddFormStore } from '../../store/useAddFormStore';
import { usePaymentMethodStore } from '../../store/usePaymentMethodStore';
import { AddPaymentMethodSheet } from '../../components/AddPaymentMethodSheet';
import { resolveIconUrl } from '@/lib/api';
import { getIoniconsName } from '@/lib/iconName';
import { SETTINGS_DARK_BACKGROUND } from '@/constants/settings-theme';
import {
    ADD_DARK_BACKGROUND,
    ADD_DARK_CARD_BACKGROUND,
    ADD_DARK_HEADER_BACKGROUND,
    ADD_DARK_SEPARATOR,
} from '@/constants/add-theme';

export default function PaymentMethodPickerScreen() {
    const { t } = useTranslation();
    const router = useRouter();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const [showSheet, setShowSheet] = useState(false);
    const { paymentMethod, setPaymentMethod } = useAddFormStore();
    const { methods } = usePaymentMethodStore();
    const darkBackground = Platform.OS === 'ios' ? ADD_DARK_BACKGROUND : SETTINGS_DARK_BACKGROUND;
    const darkCardBackground = Platform.OS === 'ios' ? ADD_DARK_CARD_BACKGROUND : '#1C1C1E';
    const darkHeaderBackground = Platform.OS === 'ios' ? ADD_DARK_HEADER_BACKGROUND : SETTINGS_DARK_BACKGROUND;
    const darkSeparator = Platform.OS === 'ios' ? ADD_DARK_SEPARATOR : '#262626';

    const handleSelect = (id: string) => {
        setPaymentMethod(id);
        router.back();
    };

    const openAddPaymentMethod = () => {
        if (Platform.OS === 'ios') {
            router.push('/add-payment-method');
            return;
        }
        setShowSheet(true);
    };

    return (
        <>
            <View
                className="flex-1 bg-[#F2F2F7] dark:bg-neutral-950 pt-6"
                style={{ backgroundColor: isDark ? darkBackground : '#F2F2F7' }}
            >
                <Stack.Screen
                    options={{
                        title: t('payment_method.title'),
                        headerBackTitle: ' ',
                        headerStyle: { backgroundColor: isDark ? darkHeaderBackground : '#F2F2F7' },
                        headerTintColor: isDark ? '#FFFFFF' : '#000000',
                        headerShadowVisible: false,
                        headerRight: () => (
                            <Pressable
                                onPress={openAddPaymentMethod}
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
                                onPress={openAddPaymentMethod}
                                className="mt-5 bg-white dark:bg-[#1C1C1E] border border-neutral-200 dark:border-neutral-700 px-4 py-2 rounded-full"
                            >
                                <Text className="text-neutral-900 dark:text-white text-sm font-semibold">
                                    {t('billing.add_new')}
                                </Text>
                            </Pressable>
                        </View>
                    ) : (
                        <View
                            key="picker-list"
                            className="bg-white dark:bg-[#1C1C1E] rounded-xl overflow-hidden"
                            style={{ backgroundColor: isDark ? darkCardBackground : '#FFFFFF' }}
                        >
                            {methods.map((method, index) => (
                                <Pressable
                                    key={method.id}
                                    onPress={() => handleSelect(method.id)}
                                    className={`px-4 py-3.5 flex-row items-center justify-between ${
                                        index < methods.length - 1 ? 'border-b border-neutral-200 dark:border-neutral-800' : ''
                                    }`}
                                    style={isDark && index < methods.length - 1
                                        ? { borderBottomColor: darkSeparator }
                                        : undefined}
                                >
                                    <View className="flex-row items-center">
                                        <View
                                            className="w-8 h-8 rounded-lg items-center justify-center mr-3"
                                            style={{ backgroundColor: `${method.color}20` }}
                                        >
                                            {method.iconUri ? (
                                                <Image
                                                    source={{ uri: resolveIconUrl(method.iconUri) }}
                                                    style={{ width: 26, height: 26, borderRadius: 6 }}
                                                />
                                            ) : (
                                                <Ionicons
                                                    name={getIoniconsName(method.iconName)}
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
