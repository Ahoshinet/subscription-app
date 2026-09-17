import React, { useRef, useState } from 'react';
import { View, Text, Pressable, TextInput, KeyboardAvoidingView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Stack, useLocalSearchParams, useNavigation } from 'expo-router';
import { usePaymentMethodStore } from '@/store/usePaymentMethodStore';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { singleLineTextInputStyle } from '@/lib/textInputStyles';
import { PRESET_BRANDS } from '@/lib/paymentMethodPresets';
import { paymentMethodAddErrorKey } from '@/lib/paymentMethodErrors';

// Pushed onto the nested Stack in app/add-payment-method/_layout.tsx, i.e.
// *inside* the modal sheet, so iOS slides it in from the right within the
// sheet the same way Reminders pushes its "List" picker. It must stay inside
// this group: registering it on the root Stack would push it behind the sheet.
export default function AddPaymentMethodBrandScreen() {
    const params = useLocalSearchParams<{ brandId: string }>();
    const navigation = useNavigation();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const { t } = useTranslation();
    const { addMethod } = usePaymentMethodStore();

    const [memo, setMemo] = useState('');
    // Guard against a second tap firing another addMethod call while the
    // first is still in flight.
    const submittedRef = useRef(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const brand = PRESET_BRANDS.find((b) => b.id === params.brandId);

    const bg = isDark ? '#1C1C1E' : '#FFFFFF';
    const segBg = isDark ? '#2C2C2E' : '#F2F2F7';
    const textPrimary = isDark ? '#FFFFFF' : '#000000';
    const textSub = isDark ? '#8E8E93' : '#6B7280';
    const brandIconBg = isDark ? '#2C2C2E' : '#E5E5EA';
    const brandIconTint = isDark ? '#98989D' : '#636366';

    if (!brand) {
        return (
            <View style={{ flex: 1, backgroundColor: bg }}>
                <Stack.Screen
                    options={{
                        title: '',
                        headerBackTitle: ' ',
                        headerBackButtonDisplayMode: 'minimal',
                        headerStyle: { backgroundColor: bg },
                        headerTintColor: textPrimary,
                        headerShadowVisible: false,
                        headerShown: true,
                    }}
                />
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
                    <Text style={{ fontSize: 16, color: textSub, textAlign: 'center', marginBottom: 24 }}>
                        {t('billing.brand_not_found')}
                    </Text>
                    <Pressable onPress={() => navigation.getParent()?.goBack()}>
                        <Text style={{ fontSize: 16, fontWeight: '600', color: '#3B82F6' }}>
                            {t('billing.back_to_brands')}
                        </Text>
                    </Pressable>
                </View>
            </View>
        );
    }

    const handleConfirm = async () => {
        if (submittedRef.current) return;
        submittedRef.current = true;
        setIsSubmitting(true);
        try {
            await addMethod({
                type: 'preset',
                label: brand.label,
                memo: memo.trim() || undefined,
                iconName: brand.iconName,
                color: brand.color,
            });
            // Close the whole modal sheet (this nested Stack) in one go, back
            // to whatever screen launched the flow. A plain back() would only
            // pop this screen inside the sheet.
            navigation.getParent()?.goBack();
        } catch (error) {
            submittedRef.current = false;
            setIsSubmitting(false);
            Alert.alert(t('common.error'), t(paymentMethodAddErrorKey(error)));
        }
    };

    return (
        <KeyboardAvoidingView style={{ flex: 1, backgroundColor: bg }} behavior="padding">
            <Stack.Screen
                options={{
                    title: brand.label,
                    headerBackTitle: ' ',
                    headerBackButtonDisplayMode: 'minimal',
                    headerStyle: { backgroundColor: bg },
                    headerTintColor: textPrimary,
                    headerTitleAlign: 'center',
                    headerShadowVisible: false,
                    headerShown: true,
                }}
            />

            <View style={{ paddingHorizontal: 20, paddingTop: 24, flex: 1 }}>
                <View style={{ alignItems: 'center', marginBottom: 33 }}>
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
                    disabled={isSubmitting}
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
