import React from 'react';
import { View, Text, ScrollView, Pressable, useColorScheme, Alert, Image } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSubscriptionStore } from '../store/useSubscriptionStore';

const BILLING_CYCLE_LABELS: Record<string, string> = {
    monthly: '月額 (Monthly)',
    yearly: '年額 (Yearly)',
    weekly: '週額 (Weekly)',
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
    credit_card: 'クレジットカード',
    debit_card: 'デビットカード',
    bank_transfer: '銀行振込',
    paypal: 'PayPal',
    other: 'その他',
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
    active: { label: 'アクティブ', color: '#22C55E' },
    inactive: { label: '非アクティブ', color: '#EAB308' },
    cancelled: { label: 'キャンセル済', color: '#EF4444' },
};

export default function DetailScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const { id } = useLocalSearchParams<{ id: string }>();

    const { subscriptions, deleteSubscription } = useSubscriptionStore();
    const subscription = subscriptions.find(s => s.id === Number(id));

    if (!subscription) {
        return (
            <View className="flex-1 bg-neutral-50 dark:bg-neutral-950 items-center justify-center">
                <Stack.Screen options={{ title: 'Not Found' }} />
                <Text className="text-neutral-500 dark:text-neutral-400 text-lg">サブスクリプションが見つかりません</Text>
            </View>
        );
    }

    const statusInfo = STATUS_LABELS[subscription.status] || { label: subscription.status, color: '#808080' };

    const formatDate = (dateStr: string) => {
        try {
            const date = new Date(dateStr);
            return `${date.getFullYear()}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}`;
        } catch {
            return dateStr;
        }
    };

    const handleDelete = () => {
        Alert.alert(
            '削除確認',
            `${subscription.service_name} を削除してもよろしいですか？`,
            [
                { text: 'キャンセル', style: 'cancel' },
                {
                    text: '削除',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteSubscription(subscription.id);
                            router.back();
                        } catch (e: any) {
                            Alert.alert('エラー', e.message || '削除に失敗しました');
                        }
                    },
                },
            ]
        );
    };

    const iconUrl = (subscription as any).icon_url;

    return (
        <View className="flex-1 bg-[#F2F2F7] dark:bg-black">
            <Stack.Screen
                options={{
                    title: subscription.service_name,
                    headerBackTitle: '',
                    headerStyle: { backgroundColor: isDark ? '#1C1C1E' : '#F2F2F7' },
                    headerTintColor: isDark ? '#FFFFFF' : '#000000',
                    headerShadowVisible: false,
                    headerRight: () => (
                        <Pressable onPress={() => router.push(`/edit?id=${subscription.id}` as any)} className="px-2">
                            <Text className="text-blue-500 dark:text-blue-400 text-lg font-semibold">編集</Text>
                        </Pressable>
                    ),
                }}
            />

            <ScrollView
                contentContainerStyle={{ paddingTop: 24, paddingBottom: 40 }}
                showsVerticalScrollIndicator={false}
            >
                {/* Hero Section */}
                <View className="items-center mb-8">
                    <View
                        className="w-20 h-20 rounded-3xl items-center justify-center mb-4"
                        style={{ backgroundColor: '#3B82F620' }}
                    >
                        {iconUrl ? (
                            <Image
                                source={{ uri: iconUrl }}
                                style={{ width: 56, height: 56, borderRadius: 14 }}
                            />
                        ) : (
                            <Ionicons name="cube" size={44} color="#3B82F6" />
                        )}
                    </View>
                    <Text className="text-3xl font-extrabold text-neutral-900 dark:text-white">
                        {subscription.currency === 'JPY' ? '¥' : subscription.currency}{subscription.amount.toLocaleString()}
                    </Text>
                    <Text className="text-neutral-500 dark:text-neutral-400 text-base mt-1">
                        {BILLING_CYCLE_LABELS[subscription.billing_cycle] || subscription.billing_cycle}
                    </Text>
                    <View className="mt-3 px-3 py-1 rounded-full" style={{ backgroundColor: statusInfo.color + '20' }}>
                        <Text style={{ color: statusInfo.color, fontWeight: '600', fontSize: 13 }}>{statusInfo.label}</Text>
                    </View>
                </View>

                <View className="px-4">
                    {/* Details Group */}
                    <View className="bg-white dark:bg-[#1C1C1E] rounded-xl overflow-hidden mb-6">
                        <DetailRow label="サービス名" value={subscription.service_name} isFirst />
                        <DetailRow label="プラン名" value={subscription.plan_name || '—'} />
                        <DetailRow label="次回支払日" value={formatDate(subscription.next_payment_date)} />
                        <DetailRow label="支払サイクル" value={BILLING_CYCLE_LABELS[subscription.billing_cycle] || subscription.billing_cycle} />
                        <DetailRow label="支払方法" value={PAYMENT_METHOD_LABELS[subscription.payment_method] || subscription.payment_method} isLast />
                    </View>

                    {/* Info Group */}
                    <View className="bg-white dark:bg-[#1C1C1E] rounded-xl overflow-hidden mb-6">
                        <DetailRow label="登録日" value={formatDate(subscription.created_at || '')} isFirst />
                        <DetailRow label="最終更新" value={formatDate(subscription.updated_at || '')} isLast />
                    </View>

                    {/* Action Buttons */}
                    <Pressable
                        onPress={handleDelete}
                        className="items-center py-4 rounded-xl bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-900/50"
                    >
                        <Text className="text-red-600 dark:text-red-400 font-bold text-base">このサブスクを削除</Text>
                    </Pressable>
                </View>
            </ScrollView>
        </View>
    );
}

function DetailRow({ label, value, isFirst = false, isLast = false }: { label: string; value: string; isFirst?: boolean; isLast?: boolean }) {
    return (
        <View
            className={`px-4 py-3.5 flex-row justify-between items-center ${!isLast ? 'border-b border-neutral-200 dark:border-neutral-800' : ''
                }`}
        >
            <Text className="text-neutral-500 dark:text-neutral-400 text-base">{label}</Text>
            <Text className="text-neutral-900 dark:text-white text-base font-medium" style={{ maxWidth: '60%', textAlign: 'right' }}>{value}</Text>
        </View>
    );
}
