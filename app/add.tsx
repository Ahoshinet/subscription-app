import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, useColorScheme, KeyboardAvoidingView, ScrollView, Platform, Alert, ActivityIndicator, ActionSheetIOS } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSubscriptionStore } from '../store/useSubscriptionStore';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

const BILLING_CYCLES = [
    { label: '月額 (Monthly)', value: 'monthly' },
    { label: '年額 (Yearly)', value: 'yearly' },
    { label: '週額 (Weekly)', value: 'weekly' },
];

const PAYMENT_METHODS = [
    { label: 'クレジットカード', value: 'credit_card' },
    { label: 'デビットカード', value: 'debit_card' },
    { label: '銀行振込', value: 'bank_transfer' },
    { label: 'PayPal', value: 'paypal' },
    { label: 'その他', value: 'other' },
];

export default function AddSubscriptionModal() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    const [serviceName, setServiceName] = useState('');
    const [planName, setPlanName] = useState('');
    const [amount, setAmount] = useState('');
    const [nextPaymentDate, setNextPaymentDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [billingCycle, setBillingCycle] = useState('monthly');
    const [paymentMethod, setPaymentMethod] = useState('credit_card');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { addSubscription } = useSubscriptionStore();

    const handleSave = async () => {
        if (!serviceName || !amount) {
            Alert.alert('入力エラー', 'サービス名と料金は必須です');
            return;
        }

        setIsSubmitting(true);
        try {
            await addSubscription({
                service_name: serviceName,
                plan_name: planName,
                amount: Number(amount) || 0,
                currency: 'JPY',
                billing_cycle: billingCycle,
                payment_method: paymentMethod,
                next_payment_date: nextPaymentDate.toISOString(),
                status: 'active',
            });
            router.back();
        } catch (error: any) {
            Alert.alert('エラー', error.message || 'サブスクリプションの追加に失敗しました');
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

    const showBillingCyclePicker = () => {
        if (Platform.OS === 'ios') {
            ActionSheetIOS.showActionSheetWithOptions(
                {
                    options: ['キャンセル', ...BILLING_CYCLES.map(c => c.label)],
                    cancelButtonIndex: 0,
                },
                (buttonIndex) => {
                    if (buttonIndex > 0) {
                        setBillingCycle(BILLING_CYCLES[buttonIndex - 1].value);
                    }
                }
            );
        } else {
            // Android fallback - cycle through options
            const currentIndex = BILLING_CYCLES.findIndex(c => c.value === billingCycle);
            const nextIndex = (currentIndex + 1) % BILLING_CYCLES.length;
            setBillingCycle(BILLING_CYCLES[nextIndex].value);
        }
    };

    const showPaymentMethodPicker = () => {
        if (Platform.OS === 'ios') {
            ActionSheetIOS.showActionSheetWithOptions(
                {
                    options: ['キャンセル', ...PAYMENT_METHODS.map(m => m.label)],
                    cancelButtonIndex: 0,
                },
                (buttonIndex) => {
                    if (buttonIndex > 0) {
                        setPaymentMethod(PAYMENT_METHODS[buttonIndex - 1].value);
                    }
                }
            );
        } else {
            const currentIndex = PAYMENT_METHODS.findIndex(m => m.value === paymentMethod);
            const nextIndex = (currentIndex + 1) % PAYMENT_METHODS.length;
            setPaymentMethod(PAYMENT_METHODS[nextIndex].value);
        }
    };

    const billingCycleLabel = BILLING_CYCLES.find(c => c.value === billingCycle)?.label || billingCycle;
    const paymentMethodLabel = PAYMENT_METHODS.find(m => m.value === paymentMethod)?.label || paymentMethod;

    const formatDate = (date: Date) => {
        return `${date.getFullYear()}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}`;
    };

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <Stack.Screen
                options={{
                    title: '新規登録',
                    headerBackVisible: false,
                    headerLeft: () => (
                        <Pressable onPress={() => router.back()} className="px-2" disabled={isSubmitting}>
                            <Text className="text-blue-500 dark:text-blue-400 text-lg font-normal">キャンセル</Text>
                        </Pressable>
                    ),
                    headerRight: () => (
                        <Pressable onPress={handleSave} className="px-2" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <ActivityIndicator size="small" color={isDark ? '#60A5FA' : '#3B82F6'} />
                            ) : (
                                <Text className="text-blue-500 dark:text-blue-400 text-lg font-semibold">追加</Text>
                            )}
                        </Pressable>
                    ),
                    headerStyle: { backgroundColor: isDark ? '#1C1C1E' : '#F2F2F7' },
                    headerTintColor: isDark ? '#FFFFFF' : '#000000',
                    headerShadowVisible: false,
                }}
            />

            <ScrollView
                className="flex-1 bg-[#F2F2F7] dark:bg-black"
                contentContainerStyle={{ paddingTop: 24, paddingBottom: 40 }}
                keyboardDismissMode="on-drag"
                keyboardShouldPersistTaps="handled"
            >
                <View className="px-4">
                    {/* Main Form Group */}
                    <View className="bg-white dark:bg-[#1C1C1E] rounded-xl overflow-hidden mb-6">
                        <View className="border-b border-neutral-200 dark:border-neutral-800 px-4 flex-row items-center" style={{ minHeight: 44 }}>
                            <Text className="text-neutral-900 dark:text-white" style={{ width: 90, fontSize: 15, lineHeight: 20 }}>サービス名:</Text>
                            <TextInput
                                placeholder="例: Netflix"
                                placeholderTextColor={isDark ? "#52525B" : "#A1A1AA"}
                                className="flex-1 text-neutral-900 dark:text-white"
                                style={{ fontSize: 15, lineHeight: 20, paddingVertical: 12 }}
                                value={serviceName}
                                onChangeText={setServiceName}
                                autoFocus
                            />
                        </View>
                        <View className="border-b border-neutral-200 dark:border-neutral-800 px-4 flex-row items-center" style={{ minHeight: 44 }}>
                            <Text className="text-neutral-900 dark:text-white" style={{ width: 90, fontSize: 15, lineHeight: 20 }}>プラン名:</Text>
                            <TextInput
                                placeholder="例: Premium"
                                placeholderTextColor={isDark ? "#52525B" : "#A1A1AA"}
                                className="flex-1 text-neutral-900 dark:text-white"
                                style={{ fontSize: 15, lineHeight: 20, paddingVertical: 12 }}
                                value={planName}
                                onChangeText={setPlanName}
                            />
                        </View>
                        <View className="px-4 flex-row items-center" style={{ minHeight: 44 }}>
                            <Text className="text-neutral-900 dark:text-white" style={{ width: 90, fontSize: 15, lineHeight: 20 }}>料金:</Text>
                            <TextInput
                                placeholder="¥ 0"
                                keyboardType="numeric"
                                placeholderTextColor={isDark ? "#52525B" : "#A1A1AA"}
                                className="flex-1 text-neutral-900 dark:text-white"
                                style={{ fontSize: 15, lineHeight: 20, paddingVertical: 12 }}
                                value={amount}
                                onChangeText={setAmount}
                            />
                        </View>
                    </View>

                    {/* Payment Details Group */}
                    <View className="bg-white dark:bg-[#1C1C1E] rounded-xl overflow-hidden mb-6">
                        <Pressable
                            onPress={() => setShowDatePicker(!showDatePicker)}
                            className="border-b border-neutral-200 dark:border-neutral-800 p-4 pl-4 flex-row items-center justify-between"
                        >
                            <Text className="text-neutral-900 dark:text-white text-base">次回支払日</Text>
                            <View className="flex-row items-center">
                                <Text className="text-neutral-500 dark:text-neutral-400 text-base mr-2">{formatDate(nextPaymentDate)}</Text>
                                <Ionicons name="chevron-forward" size={20} color={isDark ? "#52525B" : "#A1A1AA"} />
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
                            onPress={showBillingCyclePicker}
                            className="border-b border-neutral-200 dark:border-neutral-800 p-4 pl-4 flex-row items-center justify-between"
                        >
                            <Text className="text-neutral-900 dark:text-white text-base">支払サイクル</Text>
                            <View className="flex-row items-center">
                                <Text className="text-neutral-500 dark:text-neutral-400 text-base mr-2">{billingCycleLabel}</Text>
                                <Ionicons name="chevron-forward" size={20} color={isDark ? "#52525B" : "#A1A1AA"} />
                            </View>
                        </Pressable>
                        <Pressable
                            onPress={showPaymentMethodPicker}
                            className="p-4 pl-4 flex-row items-center justify-between"
                        >
                            <Text className="text-neutral-900 dark:text-white text-base">支払方法</Text>
                            <View className="flex-row items-center">
                                <Text className="text-neutral-500 dark:text-neutral-400 text-base mr-2">{paymentMethodLabel}</Text>
                                <Ionicons name="chevron-forward" size={20} color={isDark ? "#52525B" : "#A1A1AA"} />
                            </View>
                        </Pressable>
                    </View>

                    {/* Memo / Notes Group */}
                    <View className="bg-white dark:bg-[#1C1C1E] rounded-xl overflow-hidden mb-6">
                        <TextInput
                            placeholder="メモ..."
                            placeholderTextColor={isDark ? "#52525B" : "#A1A1AA"}
                            multiline
                            className="text-base text-neutral-900 dark:text-white p-4 min-h-[120px]"
                            textAlignVertical="top"
                        />
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
