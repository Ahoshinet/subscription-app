import React, { useState } from 'react';
import { View, Text, Pressable, TextInput, KeyboardAvoidingView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { usePaymentMethodStore } from '@/store/usePaymentMethodStore';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { singleLineTextInputStyle } from '@/lib/textInputStyles';
import { PRESET_BRANDS } from '@/lib/paymentMethodPresets';

// Pushed on top of app/add-payment-method.tsx's modal (plain push, not a
// further modal) so iOS renders it as a native child sheet sliding in from
// the right, the same way Reminders pushes its "List" picker.
export default function AddPaymentMethodBrandScreen() {
    const params = useLocalSearchParams<{ brandId: string }>();
    const router = useRouter();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const { t } = useTranslation();
    const { addMethod } = usePaymentMethodStore();

    const [memo, setMemo] = useState('');

    const brand = PRESET_BRANDS.find((b) => b.id === params.brandId);

    const bg = isDark ? '#1C1C1E' : '#FFFFFF';
    const segBg = isDark ? '#2C2C2E' : '#F2F2F7';
    const textPrimary = isDark ? '#FFFFFF' : '#000000';
    const textSub = isDark ? '#8E8E93' : '#6B7280';
    const borderCol = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';
    const brandIconBg = isDark ? '#2C2C2E' : '#E5E5EA';
    const brandIconTint = isDark ? '#98989D' : '#636366';

    if (!brand) return null;

    const handleConfirm = async () => {
        // Pop this screen and the add-payment-method modal beneath it in one
        // go, back to whatever screen launched the flow.
        router.dismiss(2);
        try {
            await addMethod({
                type: 'preset',
                label: brand.label,
                memo: memo.trim() || undefined,
                iconName: brand.iconName,
                color: brand.color,
            });
        } catch {
            Alert.alert(t('common.error'), t('billing.add_failed'));
        }
    };

    return (
        <KeyboardAvoidingView style={{ flex: 1, backgroundColor: bg }} behavior="padding">
            <Stack.Screen
                options={{
                    title: brand.label,
                    presentation: 'card',
                    animation: 'slide_from_right',
                    headerStyle: { backgroundColor: bg },
                    headerTintColor: textPrimary,
                    headerTitleAlign: 'center',
                    headerShadowVisible: false,
                    headerShown: true,
                }}
            />

            <View style={{ paddingHorizontal: 20, paddingTop: 24, flex: 1 }}>
                <View style={{ alignItems: 'center', marginBottom: 8 }}>
                    <View
                        style={{
                            width: 60, height: 60, borderRadius: 16,
                            backgroundColor: brandIconBg,
                            alignItems: 'center', justifyContent: 'center',
                            marginBottom: 10,
                        }}
                    >
                        <Ionicons name={brand.iconName} size={30} color={brandIconTint} />
                    </View>
                    <Text style={{ fontSize: 18, fontWeight: '700', color: textPrimary }}>
                        {brand.label}
                    </Text>
                </View>

                <View style={{ height: 1, backgroundColor: borderCol, marginBottom: 24 }} />

                <Text style={{ fontSize: 12, color: textSub, fontWeight: '600', marginBottom: 10 }}>
                    {t('billing.memo')}
                </Text>
                <View style={{ backgroundColor: segBg, borderRadius: 12, paddingHorizontal: 16, marginBottom: 24 }}>
                    <TextInput
                        value={memo}
                        onChangeText={setMemo}
                        placeholder={t('billing.memo_placeholder')}
                        placeholderTextColor={textSub}
                        autoCapitalize="none"
                        autoCorrect={false}
                        style={{
                            ...singleLineTextInputStyle,
                            height: 48, fontSize: 16, fontWeight: '400',
                            letterSpacing: 0, textAlign: 'left', color: textPrimary,
                        }}
                    />
                </View>

                <Pressable
                    onPress={() => { void handleConfirm(); }}
                    style={{
                        backgroundColor: '#3B82F6',
                        borderRadius: 14, paddingVertical: 16, alignItems: 'center',
                    }}
                >
                    <Text style={{ fontSize: 16, fontWeight: '700', color: '#fff' }}>
                        {t('billing.add_button')}
                    </Text>
                </Pressable>
            </View>
        </KeyboardAvoidingView>
    );
}
