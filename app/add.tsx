import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, useColorScheme, KeyboardAvoidingView, ScrollView, Platform, Alert, ActivityIndicator, Image, Modal, Dimensions } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useSubscriptionStore } from '../store/useSubscriptionStore';
import { useAddFormStore, BILLING_CYCLES } from '../store/useAddFormStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { usePaymentMethodStore } from '../store/usePaymentMethodStore';
import { uploadApi } from '../lib/api';
import * as ImagePicker from 'expo-image-picker';
import { setCropHandler } from '../lib/imageCropStore';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useTranslation } from 'react-i18next';
import {
    SUBSCRIPTION_ICON_PRESETS,
    SubscriptionIconPack,
    buildSubscriptionPresetIconValue,
} from '../lib/subscriptionIcon';
const { width: SCREEN_WIDTH } = Dimensions.get('window');

import { CURRENCIES } from '../lib/currency';

const ICON_PICKER_WIDTH = Math.min(SCREEN_WIDTH - 32, 360);
const ICON_PICKER_GAP = 10;
const ICON_PICKER_TILE_SIZE = Math.floor((ICON_PICKER_WIDTH - 28 - ICON_PICKER_GAP * 2) / 3);

export default function AddSubscriptionModal() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const { t } = useTranslation();

    const [serviceName, setServiceName] = useState('');
    const [planName, setPlanName] = useState('');
    const [amount, setAmount] = useState('');
    const [nextPaymentDate, setNextPaymentDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [iconUri, setIconUri] = useState<string | null>(null);
    const [selectedPresetIcon, setSelectedPresetIcon] = useState<{ pack: SubscriptionIconPack; name: string; color: string } | null>(null);
    const [showIconPickerModal, setShowIconPickerModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [memo, setMemo] = useState('');

    const { billingCycle, paymentMethod } = useAddFormStore();
    const { currency } = useSettingsStore();
    const { methods: savedPaymentMethods } = usePaymentMethodStore();
    const { addSubscription } = useSubscriptionStore();

    const handleSave = async () => {
        if (!serviceName || !amount) {
            Alert.alert(t('subscription_form.error_title'), t('subscription_form.error_required'));
            return;
        }

        setIsSubmitting(true);
        try {
            let iconUrl: string | undefined;
            if (iconUri) {
                const uploadResult = await uploadApi.uploadIcon(iconUri);
                iconUrl = uploadResult.url;
            } else if (selectedPresetIcon) {
                iconUrl = buildSubscriptionPresetIconValue(
                    selectedPresetIcon.pack,
                    selectedPresetIcon.name,
                    selectedPresetIcon.color
                );
            }
            await addSubscription({
                service_name: serviceName,
                plan_name: planName,
                amount: Number(amount) || 0,
                currency,
                billing_cycle: billingCycle,
                payment_method: paymentMethod,
                next_payment_date: nextPaymentDate.toISOString(),
                status: 'active',
                icon_url: iconUrl,
                memo: memo || undefined,
            });
            router.back();
        } catch (error: any) {
            Alert.alert(t('common.error'), error.message || t('add.error_failed'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const onDateChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
        if (Platform.OS === 'android') {
            setShowDatePicker(false);
        }
        if (selectedDate) {
            setNextPaymentDate(selectedDate);
        }
    };

    const billingCycleLabel = t(`billing_cycle.${billingCycle}`);
    const selectedPaymentMethod = savedPaymentMethods.find((m) => m.id === paymentMethod);
    const paymentMethodLabel = selectedPaymentMethod?.label ?? t('billing.no_method_selected');

    const formatDate = (date: Date) => {
        return `${date.getFullYear()}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}`;
    };

    const pickIcon = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            quality: 1,
        });
        if (!result.canceled && result.assets[0]) {
            const asset = result.assets[0];
            setCropHandler((croppedUri) => {
                setIconUri(croppedUri);
                setSelectedPresetIcon(null);
            });
            router.push({
                pathname: '/image-crop' as any,
                params: { uri: asset.uri, width: String(asset.width ?? 1), height: String(asset.height ?? 1) },
            });
        }
    };

    const handleSelectPresetIcon = (pack: SubscriptionIconPack, name: string, color: string) => {
        setIconUri(null);
        setSelectedPresetIcon({ pack, name, color });
        setShowIconPickerModal(false);
    };

    const openIconSourcePicker = () => {
        Alert.alert(t('billing.icon_source_title'), t('billing.icon_source_message'), [
            { text: t('billing.cancel'), style: 'cancel' },
            { text: t('billing.icon_source_upload'), onPress: () => { void pickIcon(); } },
            { text: t('billing.icon_source_library'), onPress: () => setShowIconPickerModal(true) },
        ]);
    };

    const renderPresetIcon = (
        icon: { pack: SubscriptionIconPack; name: string; color: string },
        size: number
    ) => {
        if (icon.pack === 'fontawesome5') {
            return <FontAwesome5 name={icon.name as any} size={size} color={icon.color} />;
        }
        return <Ionicons name={icon.name as any} size={size} color={icon.color} />;
    };

    // Shared row style for perfect vertical centering
    const rowStyle = { height: 48 };
    const labelStyle = { fontSize: 15, width: 90 };
    const inputStyle = { fontSize: 15, height: 48, paddingTop: 0, paddingBottom: 0 };

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <Stack.Screen
                options={{
                    title: t('add.title'),
                    headerBackVisible: false,
                    headerLeft: () => (
                        <Pressable onPress={() => router.back()} className="px-2" disabled={isSubmitting}>
                            {Platform.OS === 'ios' ? (
                                <Ionicons name="close" size={28} color={isDark ? "#60A5FA" : "#3B82F6"} />
                            ) : (
                                <Text className="text-blue-500 dark:text-blue-400 text-lg font-normal">{t('billing.cancel')}</Text>
                            )}
                        </Pressable>
                    ),
                    headerRight: () => (
                        <Pressable onPress={handleSave} className="px-2" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <ActivityIndicator size="small" color={isDark ? '#60A5FA' : '#3B82F6'} />
                            ) : Platform.OS === 'ios' ? (
                                <Ionicons name="checkmark" size={28} color={isDark ? "#60A5FA" : "#3B82F6"} />
                            ) : (
                                <Text className="text-blue-500 dark:text-blue-400 text-lg font-semibold">{t('add.submit')}</Text>
                            )}
                        </Pressable>
                    ),
                    headerStyle: { backgroundColor: isDark ? '#1C1C1E' : '#F2F2F7' },
                    headerTintColor: isDark ? '#FFFFFF' : '#000000',
                    headerTitleAlign: 'center',
                    headerShadowVisible: false,
                    headerShown: true,
                }}
            />

            <ScrollView
                className="flex-1 bg-[#F2F2F7] dark:bg-black"
                contentContainerStyle={{ paddingTop: 24, paddingBottom: 40 }}
                keyboardDismissMode="on-drag"
                keyboardShouldPersistTaps="handled"
            >
                <View className="px-4">
                    {/* Icon Picker */}
                    <View className="items-center mb-6">
                        <Pressable onPress={openIconSourcePicker} className="items-center">
                            <View
                                className="w-20 h-20 rounded-3xl items-center justify-center mb-2"
                                style={{ backgroundColor: isDark ? '#2C2C2E' : '#E5E5EA' }}
                            >
                                {iconUri ? (
                                    <Image
                                        source={{ uri: iconUri }}
                                        style={{ width: 80, height: 80, borderRadius: 24 }}
                                    />
                                ) : selectedPresetIcon ? (
                                    renderPresetIcon(selectedPresetIcon, 32)
                                ) : (
                                    <Ionicons name="camera" size={32} color={isDark ? '#8E8E93' : '#636366'} />
                                )}
                            </View>
                            <Text className="text-blue-500 text-sm font-medium">
                                {(iconUri || selectedPresetIcon) ? t('subscription_form.icon_change') : t('subscription_form.icon_add')}
                            </Text>
                        </Pressable>
                    </View>

                    {/* Main Form Group */}
                    <View className="bg-white dark:bg-[#1C1C1E] rounded-xl overflow-hidden mb-6">
                        <View className="border-b border-neutral-200 dark:border-neutral-800 px-4 flex-row items-center" style={rowStyle}>
                            <Text className="text-neutral-900 dark:text-white" style={labelStyle}>{t('subscription_form.service_name')}:</Text>
                            <TextInput
                                placeholder={t('subscription_form.service_name_placeholder')}
                                placeholderTextColor={isDark ? "#52525B" : "#A1A1AA"}
                                className="flex-1 text-neutral-900 dark:text-white"
                                style={inputStyle}
                                value={serviceName}
                                onChangeText={setServiceName}
                                autoFocus
                            />
                        </View>
                        <View className="border-b border-neutral-200 dark:border-neutral-800 px-4 flex-row items-center" style={rowStyle}>
                            <Text className="text-neutral-900 dark:text-white" style={labelStyle}>{t('subscription_form.plan_name')}:</Text>
                            <TextInput
                                placeholder={t('subscription_form.plan_name_placeholder')}
                                placeholderTextColor={isDark ? "#52525B" : "#A1A1AA"}
                                className="flex-1 text-neutral-900 dark:text-white"
                                style={inputStyle}
                                value={planName}
                                onChangeText={setPlanName}
                            />
                        </View>
                        <View className="border-b border-neutral-200 dark:border-neutral-800 px-4 flex-row items-center" style={rowStyle}>
                            <Text className="text-neutral-900 dark:text-white" style={labelStyle}>{t('subscription_form.amount')}:</Text>
                            <TextInput
                                placeholder={`${CURRENCIES.find(c => c.id === currency)?.symbol ?? currency} 0`}
                                keyboardType="numeric"
                                placeholderTextColor={isDark ? "#52525B" : "#A1A1AA"}
                                className="flex-1 text-neutral-900 dark:text-white"
                                style={inputStyle}
                                value={amount}
                                onChangeText={setAmount}
                            />
                        </View>
                        <Pressable
                            onPress={() => router.push('/settings/currency-picker' as any)}
                            className="px-4 flex-row items-center justify-between"
                            style={rowStyle}
                        >
                            <Text className="text-neutral-900 dark:text-white" style={labelStyle}>{t('subscription_form.currency')}:</Text>
                            <View className="flex-row items-center">
                                <Text className="text-neutral-500 dark:text-neutral-400 mr-2">{currency}</Text>
                                <Ionicons name="chevron-forward" size={16} color={isDark ? '#52525B' : '#A1A1AA'} />
                            </View>
                        </Pressable>
                    </View>

                    {/* Payment Details Group */}
                    <View className="bg-white dark:bg-[#1C1C1E] rounded-xl overflow-hidden mb-6">
                        <Pressable
                            onPress={() => setShowDatePicker(!showDatePicker)}
                            className="border-b border-neutral-200 dark:border-neutral-800 p-4 pl-4 flex-row items-center justify-between"
                        >
                            <Text className="text-neutral-900 dark:text-white text-base">{t('subscription_form.next_payment_date')}</Text>
                            <View className="flex-row items-center">
                                <Text className="text-neutral-500 dark:text-neutral-400 text-base mr-2">{formatDate(nextPaymentDate)}</Text>
                                <Ionicons name={showDatePicker ? "chevron-down" : "chevron-forward"} size={20} color={isDark ? "#52525B" : "#A1A1AA"} />
                            </View>
                        </Pressable>

                        {showDatePicker && (
                            <View className="border-b border-neutral-200 dark:border-neutral-800">
                                <DateTimePicker
                                    value={nextPaymentDate}
                                    mode="date"
                                    display={Platform.OS === 'ios' ? 'inline' : 'default'}
                                    onChange={onDateChange}
                                    themeVariant={isDark ? 'dark' : 'light'}
                                    style={{ alignSelf: 'center' }}
                                />
                            </View>
                        )}

                        <Pressable
                            onPress={() => router.push('/settings/billing-cycle' as any)}
                            className="border-b border-neutral-200 dark:border-neutral-800 p-4 pl-4 flex-row items-center justify-between"
                        >
                            <Text className="text-neutral-900 dark:text-white text-base">{t('subscription_form.billing_cycle_label')}</Text>
                            <View className="flex-row items-center">
                                <Text className="text-neutral-500 dark:text-neutral-400 text-base mr-2">{billingCycleLabel}</Text>
                                <Ionicons name="chevron-forward" size={20} color={isDark ? "#52525B" : "#A1A1AA"} />
                            </View>
                        </Pressable>
                        <Pressable
                            onPress={() => router.push('/settings/payment-method' as any)}
                            className="p-4 pl-4 flex-row items-center justify-between"
                        >
                            <Text className="text-neutral-900 dark:text-white text-base">{t('subscription_form.payment_method_label')}</Text>
                            <View className="flex-row items-center">
                                <Text className="text-neutral-500 dark:text-neutral-400 text-base mr-2">{paymentMethodLabel}</Text>
                                <Ionicons name="chevron-forward" size={20} color={isDark ? "#52525B" : "#A1A1AA"} />
                            </View>
                        </Pressable>
                    </View>

                    {/* Memo / Notes Group */}
                    <View className="bg-white dark:bg-[#1C1C1E] rounded-xl overflow-hidden mb-6">
                        <TextInput
                            placeholder={t('subscription_form.memo_placeholder')}
                            placeholderTextColor={isDark ? "#52525B" : "#A1A1AA"}
                            multiline
                            className="text-base text-neutral-900 dark:text-white p-4 min-h-[120px]"
                            textAlignVertical="top"
                            value={memo}
                            onChangeText={setMemo}
                        />
                    </View>
                </View>
            </ScrollView>

            <Modal
                transparent
                animationType="fade"
                visible={showIconPickerModal}
                onRequestClose={() => setShowIconPickerModal(false)}
            >
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.45)' }}>
                    <Pressable
                        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                        onPress={() => setShowIconPickerModal(false)}
                    />

                    <View
                        style={{
                            width: ICON_PICKER_WIDTH,
                            borderRadius: 16,
                            backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
                            paddingHorizontal: 14,
                            paddingTop: 14,
                            paddingBottom: 12,
                            maxHeight: '72%',
                        }}
                    >
                        <Text style={{ fontSize: 16, fontWeight: '700', color: isDark ? '#FFFFFF' : '#111827', marginBottom: 12 }}>
                            {t('billing.pick_icon_title')}
                        </Text>

                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 4 }}>
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                                {SUBSCRIPTION_ICON_PRESETS.map((icon, index) => (
                                    <Pressable
                                        key={icon.id}
                                        onPress={() => handleSelectPresetIcon(icon.pack, icon.name, icon.color)}
                                        style={{
                                            width: ICON_PICKER_TILE_SIZE,
                                            height: ICON_PICKER_TILE_SIZE,
                                            borderRadius: 12,
                                            backgroundColor: isDark ? '#2C2C2E' : '#F3F4F6',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            borderWidth: 1,
                                            borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                                            marginRight: index % 3 === 2 ? 0 : ICON_PICKER_GAP,
                                            marginBottom: ICON_PICKER_GAP,
                                        }}
                                    >
                                        {icon.pack === 'fontawesome5' ? (
                                            <FontAwesome5 name={icon.name as any} size={24} color={icon.color} />
                                        ) : (
                                            <Ionicons name={icon.name as any} size={24} color={icon.color} />
                                        )}
                                    </Pressable>
                                ))}
                            </View>
                        </ScrollView>

                        <Pressable
                            onPress={() => setShowIconPickerModal(false)}
                            style={{ marginTop: 10, alignItems: 'center', paddingVertical: 8 }}
                        >
                            <Text style={{ color: '#3B82F6', fontSize: 14, fontWeight: '600' }}>
                                {t('billing.cancel')}
                            </Text>
                        </Pressable>
                    </View>
                </View>
            </Modal>
        </KeyboardAvoidingView>
    );
}
