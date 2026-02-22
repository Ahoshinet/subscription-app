import React from 'react';
import { View, Text, Pressable, useColorScheme } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAddFormStore, PAYMENT_METHODS } from '../../store/useAddFormStore';

export default function PaymentMethodPickerScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const { paymentMethod, setPaymentMethod } = useAddFormStore();

    const handleSelect = (value: string) => {
        setPaymentMethod(value);
        router.back();
    };

    return (
        <View className="flex-1 bg-[#F2F2F7] dark:bg-black pt-6">
            <Stack.Screen
                options={{
                    title: '支払方法',
                    headerStyle: { backgroundColor: isDark ? '#1C1C1E' : '#F2F2F7' },
                    headerTintColor: isDark ? '#FFFFFF' : '#000000',
                    headerShadowVisible: false,
                }}
            />
            <View className="px-4">
                <View className="bg-white dark:bg-[#1C1C1E] rounded-xl overflow-hidden">
                    {PAYMENT_METHODS.map((method, index) => (
                        <Pressable
                            key={method.value}
                            onPress={() => handleSelect(method.value)}
                            className={`px-4 py-3.5 flex-row items-center justify-between ${index < PAYMENT_METHODS.length - 1 ? 'border-b border-neutral-200 dark:border-neutral-800' : ''
                                }`}
                        >
                            <Text className="text-neutral-900 dark:text-white text-base">{method.label}</Text>
                            {paymentMethod === method.value && (
                                <Ionicons name="checkmark" size={22} color="#3B82F6" />
                            )}
                        </Pressable>
                    ))}
                </View>
            </View>
        </View>
    );
}
