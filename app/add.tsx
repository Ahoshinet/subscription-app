import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, KeyboardAvoidingView, ScrollView, Platform, Alert, ActivityIndicator, Image } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Stack, useRouter } from 'expo-router';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useSubscriptionStore } from '../store/useSubscriptionStore';
import { useAddFormStore } from '../store/useAddFormStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { usePaymentMethodStore } from '../store/usePaymentMethodStore';
import { uploadApi } from '../lib/api';
import * as ImagePicker from 'expo-image-picker';
import { setCropHandler } from '../lib/imageCropStore';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTranslation } from 'react-i18next';
import {
    type SubscriptionIconSelection,
    buildSubscriptionPresetIconValue,
} from '../lib/subscriptionIcon';
import SubscriptionIconPickerSheet from '../components/SubscriptionIconPickerSheet';
import { CURRENCIES, isAmountInputAboveMax, parseAmountInput } from '../lib/currency';
import { singleLineTextInputStyle } from '../lib/textInputStyles';
import { dateOnlyToLocalDate, formatDateOnly } from '../lib/dateUtils';
import { getTodayDateInTimeZone } from '../lib/timeZone';
import { getErrorMessage } from '../lib/errors';
import {
    ADD_DARK_BACKGROUND,
    ADD_DARK_CARD_BACKGROUND,
    ADD_DARK_HEADER_BACKGROUND,
    ADD_DARK_SEPARATOR,
} from '../constants/add-theme';

export default function AddSubscriptionModal() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const { t } = useTranslation();
    const screenBackgroundColor = isDark ? ADD_DARK_BACKGROUND : '#F2F2F7';
    const cardBackgroundColor = isDark ? ADD_DARK_CARD_BACKGROUND : '#FFFFFF';
    const separatorStyle = isDark ? { borderBottomColor: ADD_DARK_SEPARATOR } : undefined;

    const [serviceName, setServiceName] = useState('');
    const [planName, setPlanName] = useState('');
    const [amount, setAmount] = useState('');
    const [nextPaymentDate, setNextPaymentDate] = useState(() => {
        const accountTimeZone = useSettingsStore.getState().timeZone;
        return dateOnlyToLocalDate(getTodayDateInTimeZone(accountTimeZone));
    });
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [iconUri, setIconUri] = useState<string | null>(null);
    const [selectedPresetIcon, setSelectedPresetIcon] =
        useState<SubscriptionIconSelection | null>(null);
    const [showIconPickerModal, setShowIconPickerModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [memo, setMemo] = useState('');

    const { billingCycle, paymentMethod, currency, setCurrency, reset: resetAddForm } = useAddFormStore();
    const { currency: defaultCurrency } = useSettingsStore();
    const { methods: savedPaymentMethods } = usePaymentMethodStore();
    const { addSubscription } = useSubscriptionStore();

    // The store is shared with the edit screen — start from clean defaults
    // instead of whatever the last edit/add session left behind.
    useEffect(() => {
        resetAddForm();
        setCurrency(defaultCurrency);
    }, [resetAddForm, setCurrency, defaultCurrency]);

    const handleSave = async () => {
        if (!serviceName || !amount) {
            Alert.alert(t('subscription_form.error_title'), t('subscription_form.error_required'));
            return;
        }
        if (isAmountInputAboveMax(amount)) {
            Alert.alert(t('subscription_form.error_title'), t('subscription_form.error_amount_too_large'));
            return;
        }
        const parsedAmount = parseAmountInput(amount);
        if (parsedAmount === null) {
            Alert.alert(t('subscription_form.error_title'), t('subscription_form.error_invalid_amount'));
            return;
        }

        setIsSubmitting(true);
        let pendingIconUrl: string | undefined;
        try {
            let iconUrl: string | undefined;
            if (iconUri) {
                const uploadResult = await uploadApi.uploadIcon(iconUri);
                iconUrl = uploadResult.url;
                pendingIconUrl = uploadResult.url;
            } else if (selectedPresetIcon) {
                iconUrl = buildSubscriptionPresetIconValue(selectedPresetIcon);
            }
            await addSubscription({
                service_name: serviceName,
                plan_name: planName,
                amount: parsedAmount,
                currency,
                billing_cycle: billingCycle,
                payment_method: paymentMethod,
                next_payment_date: formatDateOnly(nextPaymentDate),
                status: 'active',
                icon_url: iconUrl,
                memo: memo || undefined,
            });
            router.back();
        } catch (error: unknown) {
            if (pendingIconUrl?.startsWith('/uploads/pending/')) {
                await uploadApi.deletePending(pendingIconUrl).catch(() => {});
            }
            Alert.alert(
                t('common.error'),
                getErrorMessage(error, t('add.error_failed')),
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const onDateChange = (selectedDate: Date) => {
        if (Platform.OS === 'android') {
            setShowDatePicker(false);
        }
        setNextPaymentDate(selectedDate);
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
                pathname: '/image-crop',
                params: { uri: asset.uri, width: String(asset.width ?? 1), height: String(asset.height ?? 1) },
            });
        }
    };

    const handleSelectPresetIcon = (icon: SubscriptionIconSelection) => {
        setIconUri(null);
        setSelectedPresetIcon(icon);
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
        icon: SubscriptionIconSelection,
        size: number
    ) => {
        if (icon.pack === 'fontawesome5') {
            return <FontAwesome5 name={icon.name} size={size} color={icon.color} />;
        }
        return <Ionicons name={icon.name} size={size} color={icon.color} />;
    };

    // Shared row style for perfect vertical centering
    const rowStyle = { height: 48 };
    const labelStyle = { fontSize: 15, width: 90 };
    const inputStyle = {
        ...singleLineTextInputStyle,
        fontSize: 15,
        height: 48,
        paddingBottom: 0,
    };

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <Stack.Screen
                options={{
                    title: t('add.title'),
                    headerBackVisible: false,
                    unstable_headerLeftItems: Platform.OS === 'ios'
                        ? () => [{
                            type: 'button',
                            label: t('billing.cancel'),
                            accessibilityLabel: t('billing.cancel'),
                            icon: { type: 'sfSymbol', name: 'xmark' },
                            variant: 'plain',
                            disabled: isSubmitting,
                            onPress: () => router.back(),
                        }]
                        : undefined,
                    unstable_headerRightItems: Platform.OS === 'ios'
                        ? () => [{
                            type: 'button',
                            label: t('add.submit'),
                            accessibilityLabel: t('add.submit'),
                            icon: { type: 'sfSymbol', name: 'checkmark' },
                            variant: 'done',
                            disabled: isSubmitting,
                            onPress: () => { void handleSave(); },
                        }]
                        : undefined,
                    headerLeft: Platform.OS !== 'ios' ? () => (
                        <Pressable onPress={() => router.back()} className="px-2" disabled={isSubmitting}>
                            <Text className="text-blue-500 dark:text-blue-400 text-lg font-normal">{t('billing.cancel')}</Text>
                        </Pressable>
                    ) : undefined,
                    headerRight: Platform.OS !== 'ios' ? () => (
                        <Pressable onPress={handleSave} className="px-2" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <ActivityIndicator size="small" color={isDark ? '#60A5FA' : '#3B82F6'} />
                            ) : (
                                <Text className="text-blue-500 dark:text-blue-400 text-lg font-semibold">{t('add.submit')}</Text>
                            )}
                        </Pressable>
                    ) : undefined,
                    headerStyle: { backgroundColor: isDark ? ADD_DARK_HEADER_BACKGROUND : '#F2F2F7' },
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
                style={{ backgroundColor: screenBackgroundColor }}
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
                    <View
                        className="bg-white dark:bg-[#1C1C1E] rounded-xl overflow-hidden mb-6"
                        style={{ backgroundColor: cardBackgroundColor }}
                    >
                        <View className="border-b border-neutral-200 dark:border-neutral-800 px-4 flex-row items-center" style={[rowStyle, separatorStyle]}>
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
                        <View className="border-b border-neutral-200 dark:border-neutral-800 px-4 flex-row items-center" style={[rowStyle, separatorStyle]}>
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
                        <View className="border-b border-neutral-200 dark:border-neutral-800 px-4 flex-row items-center" style={[rowStyle, separatorStyle]}>
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
                            onPress={() => router.push('/settings/currency-picker')}
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
                    <View
                        className="bg-white dark:bg-[#1C1C1E] rounded-xl overflow-hidden mb-6"
                        style={{ backgroundColor: cardBackgroundColor }}
                    >
                        <Pressable
                            onPress={() => setShowDatePicker(!showDatePicker)}
                            className="border-b border-neutral-200 dark:border-neutral-800 p-4 pl-4 flex-row items-center justify-between"
                            style={separatorStyle}
                        >
                            <Text className="text-neutral-900 dark:text-white text-base">{t('subscription_form.next_payment_date')}</Text>
                            <View className="flex-row items-center">
                                <Text className="text-neutral-500 dark:text-neutral-400 text-base mr-2">{formatDate(nextPaymentDate)}</Text>
                                <Ionicons name={showDatePicker ? "chevron-down" : "chevron-forward"} size={20} color={isDark ? "#52525B" : "#A1A1AA"} />
                            </View>
                        </Pressable>

                        {showDatePicker && (
                            <View className="border-b border-neutral-200 dark:border-neutral-800" style={separatorStyle}>
                                <DateTimePicker
                                    value={nextPaymentDate}
                                    mode="date"
                                    display={Platform.OS === 'ios' ? 'inline' : 'default'}
                                    onValueChange={(_, selectedDate) => onDateChange(selectedDate)}
                                    onDismiss={() => setShowDatePicker(false)}
                                    themeVariant={isDark ? 'dark' : 'light'}
                                    style={{ alignSelf: 'center' }}
                                />
                            </View>
                        )}

                        <Pressable
                            onPress={() => router.push('/settings/billing-cycle')}
                            className="border-b border-neutral-200 dark:border-neutral-800 p-4 pl-4 flex-row items-center justify-between"
                            style={separatorStyle}
                        >
                            <Text className="text-neutral-900 dark:text-white text-base">{t('subscription_form.billing_cycle_label')}</Text>
                            <View className="flex-row items-center">
                                <Text className="text-neutral-500 dark:text-neutral-400 text-base mr-2">{billingCycleLabel}</Text>
                                <Ionicons name="chevron-forward" size={20} color={isDark ? "#52525B" : "#A1A1AA"} />
                            </View>
                        </Pressable>
                        <Pressable
                            onPress={() => router.push('/settings/payment-method')}
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
                    <View
                        className="bg-white dark:bg-[#1C1C1E] rounded-xl overflow-hidden mb-6"
                        style={{ backgroundColor: cardBackgroundColor }}
                    >
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

            <SubscriptionIconPickerSheet
                visible={showIconPickerModal}
                isDark={isDark}
                title={t('billing.pick_icon_title')}
                cancelLabel={t('billing.cancel')}
                onClose={() => setShowIconPickerModal(false)}
                onSelect={handleSelectPresetIcon}
            />
        </KeyboardAvoidingView>
    );
}
