import React from 'react';
import { View, Text, ScrollView, Pressable, useColorScheme, Alert, Image } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useSubscriptionStore } from '../store/useSubscriptionStore';
import { useTranslation } from 'react-i18next';
import { parseSubscriptionPresetIconValue } from '../lib/subscriptionIcon';

const STATUS_COLORS: Record<string, string> = {
    active: '#22C55E',
    inactive: '#EAB308',
    cancelled: '#EF4444',
};

export default function DetailScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const { id } = useLocalSearchParams<{ id: string }>();

    const { subscriptions, deleteSubscription } = useSubscriptionStore();
    const subscription = subscriptions.find(s => s.id === Number(id));
    const { t } = useTranslation();

    if (!subscription) {
        return (
            <View className="flex-1 bg-neutral-50 dark:bg-neutral-950 items-center justify-center">
                <Stack.Screen options={{ title: 'Not Found' }} />
                <Text className="text-neutral-500 dark:text-neutral-400 text-lg">{t('edit.not_found')}</Text>
            </View>
        );
    }

    const statusColor = STATUS_COLORS[subscription.status] ?? '#808080';
    const statusLabel = t(`detail.status_${subscription.status}`, { defaultValue: subscription.status });

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
            t('detail.delete_title'),
            t('detail.delete_message', { name: subscription.service_name }),
            [
                { text: t('billing.cancel'), style: 'cancel' },
                {
                    text: t('detail.delete_confirm'),
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteSubscription(subscription.id);
                            router.back();
                        } catch (e: any) {
                            Alert.alert(t('common.error'), e.message || t('detail.error_delete_failed'));
                        }
                    },
                },
            ]
        );
    };

    const iconUrl = (subscription as any).icon_url;
    const presetIcon = parseSubscriptionPresetIconValue(iconUrl);

    return (
        <View className="flex-1 bg-[#F2F2F7] dark:bg-black">
            <Stack.Screen
                options={{
                    title: subscription.service_name,
                    headerBackTitle: ' ',
                    headerStyle: { backgroundColor: isDark ? '#1C1C1E' : '#F2F2F7' },
                    headerTintColor: isDark ? '#FFFFFF' : '#000000',
                    headerShadowVisible: false,
                    headerRight: () => (
                        <Pressable onPress={() => router.push(`/edit?id=${subscription.id}` as any)} className="px-2">
                            <Text className="text-blue-500 dark:text-blue-400 text-lg font-semibold">{t('detail.edit_button')}</Text>
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
                        {presetIcon ? (
                            presetIcon.pack === 'fontawesome5' ? (
                                <FontAwesome5 name={presetIcon.name as any} size={44} color={presetIcon.color} />
                            ) : (
                                <Ionicons name={presetIcon.name as any} size={44} color={presetIcon.color} />
                            )
                        ) : iconUrl ? (
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
                        {t(`billing_cycle.${subscription.billing_cycle}`, { defaultValue: subscription.billing_cycle })}
                    </Text>
                    <View className="mt-3 px-3 py-1 rounded-full" style={{ backgroundColor: statusColor + '20' }}>
                        <Text style={{ color: statusColor, fontWeight: '600', fontSize: 13 }}>{statusLabel}</Text>
                    </View>
                </View>

                <View className="px-4">
                    {/* Details Group */}
                    <View className="bg-white dark:bg-[#1C1C1E] rounded-xl overflow-hidden mb-6">
                        <DetailRow label={t('detail.label_service_name')} value={subscription.service_name} isFirst />
                        <DetailRow label={t('detail.label_plan_name')} value={subscription.plan_name || '—'} />
                        <DetailRow label={t('detail.label_next_payment')} value={formatDate(subscription.next_payment_date)} />
                        <DetailRow label={t('detail.label_billing_cycle')} value={t(`billing_cycle.${subscription.billing_cycle}`, { defaultValue: subscription.billing_cycle })} />
                        <DetailRow label={t('detail.label_payment_method')} value={t(`payment_method.${subscription.payment_method}`, { defaultValue: subscription.payment_method })} isLast />
                    </View>

                    {/* Info Group */}
                    <View className="bg-white dark:bg-[#1C1C1E] rounded-xl overflow-hidden mb-6">
                        <DetailRow label={t('detail.label_created_at')} value={formatDate(subscription.created_at || '')} isFirst />
                        <DetailRow label={t('detail.label_updated_at')} value={formatDate(subscription.updated_at || '')} isLast />
                    </View>

                    {/* Action Buttons */}
                    <Pressable
                        onPress={handleDelete}
                        className="items-center py-4 rounded-xl bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-900/50"
                    >
                        <Text className="text-red-600 dark:text-red-400 font-bold text-base">{t('detail.delete_button')}</Text>
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
