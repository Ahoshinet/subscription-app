import React from 'react';
import { View, Text, TextInput, Pressable, KeyboardAvoidingView, ScrollView, Platform, ActivityIndicator, Image, Modal, Dimensions } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTranslation } from 'react-i18next';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { resolveIconUrl, type Subscription } from '@/lib/api';
import { SUBSCRIPTION_ICON_PRESETS } from '@/lib/subscriptionIcon';
import { singleLineTextInputStyle } from '@/lib/textInputStyles';
import { useSubscriptionStore } from '@/store/useSubscriptionStore';
import IconSourceSheet from '@/components/IconSourceSheet';
import { formatEditDate, useEditSubscriptionForm } from './use-edit-subscription-form';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ICON_PICKER_WIDTH = Math.min(SCREEN_WIDTH - 32, 360);
const ICON_PICKER_GAP = 10;
const ICON_PICKER_TILE_SIZE = Math.floor((ICON_PICKER_WIDTH - 28 - ICON_PICKER_GAP * 2) / 3);

// Android/default edit screen. Keep this implementation until the Material
// Design pass; the iOS design lives in edit-screen.ios.tsx.
export default function EditSubscriptionScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { t } = useTranslation();

    const { subscriptions } = useSubscriptionStore();
    const numId = Number(id);
    const subscription = !isNaN(numId) ? subscriptions.find(s => s.id === numId) : undefined;

    if (!subscription) {
        return (
            <View className="flex-1 bg-neutral-50 dark:bg-neutral-950 items-center justify-center">
                <Stack.Screen options={{ title: 'Not Found' }} />
                <Text className="text-neutral-500 dark:text-neutral-400 text-lg">{t('edit.not_found')}</Text>
            </View>
        );
    }

    return <EditSubscriptionForm key={subscription.id} subscription={subscription} />;
}

function EditSubscriptionForm({ subscription }: { subscription: Subscription }) {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const form = useEditSubscriptionForm(subscription);
    const { router, t } = form;

    const onDateChange = (selectedDate: Date) => {
        if (Platform.OS === 'android') form.setShowDatePicker(false);
        form.setNextPaymentDate(selectedDate);
    };

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
                    title: t('edit.title'),
                    headerBackVisible: false,
                    headerLeft: () => (
                        <Pressable onPress={() => router.back()} className="px-2" disabled={form.isSubmitting}>
                            <Text className="text-blue-500 dark:text-blue-400 text-lg font-normal">{t('billing.cancel')}</Text>
                        </Pressable>
                    ),
                    headerRight: () => (
                        <Pressable onPress={form.handleSave} className="px-2" disabled={form.isSubmitting}>
                            {form.isSubmitting ? (
                                <ActivityIndicator size="small" color={isDark ? '#60A5FA' : '#3B82F6'} />
                            ) : (
                                <Text className="text-blue-500 dark:text-blue-400 text-lg font-semibold">{t('edit.submit')}</Text>
                            )}
                        </Pressable>
                    ),
                    headerStyle: { backgroundColor: isDark ? '#0A0A0A' : '#ffffff' },
                    headerTintColor: isDark ? '#FFFFFF' : '#000000',
                    headerTitleAlign: 'center',
                    headerShadowVisible: true,
                    headerShown: true,
                }}
            />

            <ScrollView
                className="flex-1 bg-[#F2F2F7] dark:bg-neutral-950"
                contentContainerStyle={{ paddingTop: 24, paddingBottom: 40 }}
                keyboardDismissMode="on-drag"
                keyboardShouldPersistTaps="handled"
            >
                <View className="px-4">
                    {/* Icon Picker */}
                    <View className="items-center mb-6">
                        <Pressable onPress={() => form.setShowIconSourceSheet(true)} className="items-center">
                            <View
                                className="w-20 h-20 rounded-3xl items-center justify-center mb-2"
                                style={{ backgroundColor: isDark ? '#2C2C2E' : '#E5E5EA' }}
                            >
                                {form.presetIcon ? (
                                    form.presetIcon.pack === 'fontawesome5' ? (
                                        <FontAwesome5 name={form.presetIcon.name} size={32} color={form.presetIcon.color} />
                                    ) : (
                                        <Ionicons name={form.presetIcon.name} size={32} color={form.presetIcon.color} />
                                    )
                                ) : form.iconUri && !form.iconPreviewError ? (
                                    <Image
                                        source={{ uri: resolveIconUrl(form.iconUri) }}
                                        style={{ width: 80, height: 80, borderRadius: 24 }}
                                        onError={() => form.setIconPreviewError(true)}
                                    />
                                ) : (
                                    <Ionicons name="camera" size={32} color={isDark ? '#8E8E93' : '#636366'} />
                                )}
                            </View>
                            <Text className="text-blue-500 text-sm font-medium">
                                {form.iconUri ? t('subscription_form.icon_change') : t('subscription_form.icon_add')}
                            </Text>
                        </Pressable>
                    </View>

                    {/* Main Form Group */}
                    <View className="bg-white dark:bg-[#1C1C1C] rounded-xl overflow-hidden mb-6">
                        <View className="border-b border-neutral-200 dark:border-neutral-800 px-4 flex-row items-center" style={rowStyle}>
                            <Text className="text-neutral-900 dark:text-white" style={labelStyle}>{t('subscription_form.service_name')}:</Text>
                            <TextInput
                                placeholder={t('subscription_form.service_name_placeholder')}
                                placeholderTextColor={isDark ? "#52525B" : "#A1A1AA"}
                                className="flex-1 text-neutral-900 dark:text-white"
                                style={inputStyle}
                                value={form.serviceName}
                                onChangeText={form.setServiceName}
                            />
                        </View>
                        <View className="border-b border-neutral-200 dark:border-neutral-800 px-4 flex-row items-center" style={rowStyle}>
                            <Text className="text-neutral-900 dark:text-white" style={labelStyle}>{t('subscription_form.plan_name')}:</Text>
                            <TextInput
                                placeholder={t('subscription_form.plan_name_placeholder')}
                                placeholderTextColor={isDark ? "#52525B" : "#A1A1AA"}
                                className="flex-1 text-neutral-900 dark:text-white"
                                style={inputStyle}
                                value={form.planName}
                                onChangeText={form.setPlanName}
                            />
                        </View>
                        <View className="border-b border-neutral-200 dark:border-neutral-800 px-4 flex-row items-center" style={rowStyle}>
                            <Text className="text-neutral-900 dark:text-white" style={labelStyle}>{t('subscription_form.amount')}:</Text>
                            <TextInput
                                placeholder={form.amountPlaceholder}
                                keyboardType="numeric"
                                placeholderTextColor={isDark ? "#52525B" : "#A1A1AA"}
                                className="flex-1 text-neutral-900 dark:text-white"
                                style={inputStyle}
                                value={form.amount}
                                onChangeText={form.setAmount}
                            />
                        </View>
                        <Pressable
                            onPress={() => router.push('/settings/currency-picker')}
                            className="px-4 flex-row items-center justify-between"
                            style={rowStyle}
                        >
                            <Text className="text-neutral-900 dark:text-white" style={labelStyle}>{t('subscription_form.currency')}:</Text>
                            <View className="flex-row items-center">
                                <Text className="text-neutral-500 dark:text-neutral-400 mr-2">{form.currency}</Text>
                                <Ionicons name="chevron-forward" size={16} color={isDark ? '#52525B' : '#A1A1AA'} />
                            </View>
                        </Pressable>
                    </View>

                    {/* Payment Details Group */}
                    <View className="bg-white dark:bg-[#1C1C1C] rounded-xl overflow-hidden mb-6">
                        <Pressable
                            onPress={() => form.setShowDatePicker(!form.showDatePicker)}
                            className="border-b border-neutral-200 dark:border-neutral-800 p-4 pl-4 flex-row items-center justify-between"
                        >
                            <Text className="text-neutral-900 dark:text-white text-base">{t('subscription_form.next_payment_date')}</Text>
                            <View className="flex-row items-center">
                                <Text className="text-neutral-500 dark:text-neutral-400 text-base mr-2">{formatEditDate(form.nextPaymentDate)}</Text>
                                <Ionicons name={form.showDatePicker ? "chevron-down" : "chevron-forward"} size={20} color={isDark ? "#52525B" : "#A1A1AA"} />
                            </View>
                        </Pressable>

                        {form.showDatePicker && (
                            <View className="border-b border-neutral-200 dark:border-neutral-800">
                                <DateTimePicker
                                    value={form.nextPaymentDate}
                                    mode="date"
                                    display="default"
                                    onValueChange={(_, selectedDate) => onDateChange(selectedDate)}
                                    onDismiss={() => form.setShowDatePicker(false)}
                                    themeVariant={isDark ? 'dark' : 'light'}
                                    style={{ alignSelf: 'center' }}
                                />
                            </View>
                        )}

                        <Pressable
                            onPress={() => router.push('/settings/billing-cycle')}
                            className="border-b border-neutral-200 dark:border-neutral-800 p-4 pl-4 flex-row items-center justify-between"
                        >
                            <Text className="text-neutral-900 dark:text-white text-base">{t('subscription_form.billing_cycle_label')}</Text>
                            <View className="flex-row items-center">
                                <Text className="text-neutral-500 dark:text-neutral-400 text-base mr-2">{form.billingCycleLabel}</Text>
                                <Ionicons name="chevron-forward" size={20} color={isDark ? "#52525B" : "#A1A1AA"} />
                            </View>
                        </Pressable>
                        <Pressable
                            onPress={() => router.push('/settings/payment-method')}
                            className="p-4 pl-4 flex-row items-center justify-between"
                        >
                            <Text className="text-neutral-900 dark:text-white text-base">{t('subscription_form.payment_method_label')}</Text>
                            <View className="flex-row items-center">
                                <Text className="text-neutral-500 dark:text-neutral-400 text-base mr-2">{form.paymentMethodLabel}</Text>
                                <Ionicons name="chevron-forward" size={20} color={isDark ? "#52525B" : "#A1A1AA"} />
                            </View>
                        </Pressable>
                    </View>

                    {/* Memo / Notes Group */}
                    <View className="bg-white dark:bg-[#1C1C1C] rounded-xl overflow-hidden mb-6">
                        <TextInput
                            placeholder={t('subscription_form.memo_placeholder')}
                            placeholderTextColor={isDark ? "#52525B" : "#A1A1AA"}
                            multiline
                            className="text-base text-neutral-900 dark:text-white p-4 min-h-[120px]"
                            textAlignVertical="top"
                            value={form.memo}
                            onChangeText={form.setMemo}
                        />
                    </View>
                </View>
            </ScrollView>

            <IconSourceSheet
                visible={form.showIconSourceSheet}
                isDark={isDark}
                onClose={() => form.setShowIconSourceSheet(false)}
                onSelect={form.handleSelectIconSource}
            />
            <Modal
                transparent
                animationType="fade"
                visible={form.showIconPickerModal}
                onRequestClose={() => form.setShowIconPickerModal(false)}
            >
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.45)' }}>
                    <Pressable
                        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                        onPress={() => form.setShowIconPickerModal(false)}
                    />

                    <View
                        style={{
                            width: ICON_PICKER_WIDTH,
                            borderRadius: 16,
                            backgroundColor: isDark ? '#1C1C1C' : '#FFFFFF',
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
                                        onPress={() => form.handleSelectPresetIcon(icon)}
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
                                            <FontAwesome5 name={icon.name} size={24} color={icon.color} />
                                        ) : (
                                            <Ionicons name={icon.name} size={24} color={icon.color} />
                                        )}
                                    </Pressable>
                                ))}
                            </View>
                        </ScrollView>

                        <Pressable
                            onPress={() => form.setShowIconPickerModal(false)}
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
