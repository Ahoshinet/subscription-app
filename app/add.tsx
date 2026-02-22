import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, useColorScheme, KeyboardAvoidingView, ScrollView, Platform, Alert, ActivityIndicator, Image } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSubscriptionStore } from '../store/useSubscriptionStore';
import { useAddFormStore, BILLING_CYCLES, PAYMENT_METHODS } from '../store/useAddFormStore';
import { uploadApi } from '../lib/api';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

export default function AddSubscriptionModal() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    const [serviceName, setServiceName] = useState('');
    const [planName, setPlanName] = useState('');
    const [amount, setAmount] = useState('');
    const [nextPaymentDate, setNextPaymentDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [iconUri, setIconUri] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { billingCycle, paymentMethod } = useAddFormStore();
    const { addSubscription } = useSubscriptionStore();

    const handleSave = async () => {
        if (!serviceName || !amount) {
            Alert.alert('入力エラー', 'サービス名と料金は必須です');
            return;
        }

        setIsSubmitting(true);
        try {
            let iconUrl: string | undefined;
            if (iconUri) {
                const uploadResult = await uploadApi.uploadIcon(iconUri);
                iconUrl = uploadResult.url;
            }
            await addSubscription({
                service_name: serviceName,
                plan_name: planName,
                amount: Number(amount) || 0,
                currency: 'JPY',
                billing_cycle: billingCycle,
                payment_method: paymentMethod,
                next_payment_date: nextPaymentDate.toISOString(),
                status: 'active',
                icon_url: iconUrl,
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

    const billingCycleLabel = BILLING_CYCLES.find(c => c.value === billingCycle)?.label || billingCycle;
    const paymentMethodLabel = PAYMENT_METHODS.find(m => m.value === paymentMethod)?.label || paymentMethod;

    const formatDate = (date: Date) => {
        return `${date.getFullYear()}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}`;
    };

    const pickIcon = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });
        if (!result.canceled && result.assets[0]) {
            setIconUri(result.assets[0].uri);
        }
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
                        <Pressable onPress={pickIcon} className="items-center">
                            <View
                                className="w-20 h-20 rounded-3xl items-center justify-center mb-2"
                                style={{ backgroundColor: isDark ? '#2C2C2E' : '#E5E5EA' }}
                            >
                                {iconUri ? (
                                    <Image
                                        source={{ uri: iconUri }}
                                        style={{ width: 56, height: 56, borderRadius: 14 }}
                                    />
                                ) : (
                                    <Ionicons name="camera" size={32} color={isDark ? '#8E8E93' : '#636366'} />
                                )}
                            </View>
                            <Text className="text-blue-500 text-sm font-medium">
                                {iconUri ? 'アイコンを変更' : 'アイコンを追加'}
                            </Text>
                        </Pressable>
                    </View>

                    {/* Main Form Group */}
                    <View className="bg-white dark:bg-[#1C1C1E] rounded-xl overflow-hidden mb-6">
                        <View className="border-b border-neutral-200 dark:border-neutral-800 px-4 flex-row items-center" style={rowStyle}>
                            <Text className="text-neutral-900 dark:text-white" style={labelStyle}>サービス名:</Text>
                            <TextInput
                                placeholder="例: Netflix"
                                placeholderTextColor={isDark ? "#52525B" : "#A1A1AA"}
                                className="flex-1 text-neutral-900 dark:text-white"
                                style={inputStyle}
                                value={serviceName}
                                onChangeText={setServiceName}
                                autoFocus
                            />
                        </View>
                        <View className="border-b border-neutral-200 dark:border-neutral-800 px-4 flex-row items-center" style={rowStyle}>
                            <Text className="text-neutral-900 dark:text-white" style={labelStyle}>プラン名:</Text>
                            <TextInput
                                placeholder="例: Premium"
                                placeholderTextColor={isDark ? "#52525B" : "#A1A1AA"}
                                className="flex-1 text-neutral-900 dark:text-white"
                                style={inputStyle}
                                value={planName}
                                onChangeText={setPlanName}
                            />
                        </View>
                        <View className="px-4 flex-row items-center" style={rowStyle}>
                            <Text className="text-neutral-900 dark:text-white" style={labelStyle}>料金:</Text>
                            <TextInput
                                placeholder="¥ 0"
                                keyboardType="numeric"
                                placeholderTextColor={isDark ? "#52525B" : "#A1A1AA"}
                                className="flex-1 text-neutral-900 dark:text-white"
                                style={inputStyle}
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
                            <Text className="text-neutral-900 dark:text-white text-base">支払サイクル</Text>
                            <View className="flex-row items-center">
                                <Text className="text-neutral-500 dark:text-neutral-400 text-base mr-2">{billingCycleLabel}</Text>
                                <Ionicons name="chevron-forward" size={20} color={isDark ? "#52525B" : "#A1A1AA"} />
                            </View>
                        </Pressable>
                        <Pressable
                            onPress={() => router.push('/settings/payment-method' as any)}
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
