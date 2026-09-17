import React from 'react';
import { Platform, View, Text, Pressable } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAddFormStore } from '../../store/useAddFormStore';
import { CURRENCIES, CurrencyId } from '../../lib/currency';
import { SETTINGS_DARK_BACKGROUND } from '@/constants/settings-theme';
import {
    ADD_DARK_BACKGROUND,
    ADD_DARK_CARD_BACKGROUND,
    ADD_DARK_HEADER_BACKGROUND,
    ADD_DARK_SEPARATOR,
} from '@/constants/add-theme';

export default function CurrencyPickerScreen() {
    const { t } = useTranslation();
    const router = useRouter();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const { currency, setCurrency } = useAddFormStore();
    // Pushed from the add/edit sheet, so iOS follows that sheet's layered palette.
    const darkBackground = Platform.OS === 'ios' ? ADD_DARK_BACKGROUND : SETTINGS_DARK_BACKGROUND;
    const darkCardBackground = Platform.OS === 'ios' ? ADD_DARK_CARD_BACKGROUND : '#1C1C1E';
    const darkHeaderBackground = Platform.OS === 'ios' ? ADD_DARK_HEADER_BACKGROUND : SETTINGS_DARK_BACKGROUND;
    const darkSeparator = Platform.OS === 'ios' ? ADD_DARK_SEPARATOR : '#262626';

    const handleSelect = (value: CurrencyId) => {
        setCurrency(value);
        router.back();
    };

    return (
        <View
            className="flex-1 bg-[#F2F2F7] dark:bg-neutral-950 pt-6"
            style={{ backgroundColor: isDark ? darkBackground : '#F2F2F7' }}
        >
            <Stack.Screen
                options={{
                    title: t('subscription_form.currency'),
                    headerBackTitle: ' ',
                    headerStyle: { backgroundColor: isDark ? darkHeaderBackground : '#F2F2F7' },
                    headerTintColor: isDark ? '#FFFFFF' : '#000000',
                    headerShadowVisible: false,
                }}
            />
            <View className="px-4">
                <View
                    className="bg-white dark:bg-[#1C1C1E] rounded-xl overflow-hidden"
                    style={{ backgroundColor: isDark ? darkCardBackground : '#FFFFFF' }}
                >
                    {CURRENCIES.map((c, index) => (
                        <Pressable
                            key={c.id}
                            onPress={() => handleSelect(c.id)}
                            className={`px-4 py-3.5 flex-row items-center justify-between ${index < CURRENCIES.length - 1 ? 'border-b border-neutral-200 dark:border-neutral-800' : ''}`}
                            style={[
                                { minHeight: 52 },
                                isDark && index < CURRENCIES.length - 1 ? { borderBottomColor: darkSeparator } : undefined,
                            ]}
                        >
                            <Text className="text-neutral-900 dark:text-white text-base">
                                {c.symbol} {c.id} — {c.name}
                            </Text>
                            {currency === c.id && (
                                <Ionicons name="checkmark" size={22} color="#3B82F6" />
                            )}
                        </Pressable>
                    ))}
                </View>
            </View>
        </View>
    );
}
