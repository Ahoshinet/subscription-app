import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Alert, Image, ActivityIndicator, Platform, Switch } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons, FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { useSubscriptionStore } from '../store/useSubscriptionStore';
import { usePaymentMethodStore } from '../store/usePaymentMethodStore';
import { useTranslation } from 'react-i18next';
import { parseSubscriptionPresetIconValue } from '../lib/subscriptionIcon';
import { subscriptionApi, resolveIconUrl } from '../lib/api';
import { formatDateOnlyForDisplay, getEffectiveNextPaymentDate } from '../lib/dateUtils';
import { getErrorMessage } from '../lib/errors';
import { getTodayDateInTimeZone } from '../lib/timeZone';
import { useSettingsStore } from '../store/useSettingsStore';

export default function DetailScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const { id } = useLocalSearchParams<{ id: string }>();
    const [isTogglingStatus, setIsTogglingStatus] = useState(false);
    const [pendingIsActive, setPendingIsActive] = useState<boolean | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [imageError, setImageError] = useState(false);

    const { subscriptions, deleteSubscription, fetchSubscriptions } = useSubscriptionStore();
    const subscription = subscriptions.find(s => s.id === Number(id));
    const { methods: paymentMethods } = usePaymentMethodStore();
    const { timeZone } = useSettingsStore();
    const { t } = useTranslation();
    const todayDate = getTodayDateInTimeZone(timeZone);

    if (!subscription) {
        return (
            <View className="flex-1 bg-neutral-50 dark:bg-neutral-950 items-center justify-center">
                <Stack.Screen
                    options={{
                        title: 'Not Found',
                        headerShown: true,
                        headerBackTitle: ' ',
                        headerStyle: { backgroundColor: isDark ? '#0A0A0A' : '#ffffff' },
                        headerTintColor: isDark ? '#ffffff' : '#000000',
                        headerShadowVisible: true,
                    }}
                />
                <Text className="text-neutral-500 dark:text-neutral-400 text-lg">{t('edit.not_found')}</Text>
            </View>
        );
    }

    const isActive = subscription.status === 'active';
    const displayedIsActive = pendingIsActive ?? isActive;
    const displayedStatus = displayedIsActive ? 'active' : 'inactive';
    const statusLabel = t(`detail.status_${displayedStatus}`, { defaultValue: displayedStatus });
    const billingCycleSuffix = t(
        subscription.billing_cycle === 'yearly'
            ? 'detail.price_period_yearly'
            : subscription.billing_cycle === 'weekly'
                ? 'detail.price_period_weekly'
                : 'detail.price_period_monthly'
    );

    const formatDate = (dateStr: string) => {
        try {
            const date = new Date(dateStr);
            return `${date.getFullYear()}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}`;
        } catch {
            return dateStr;
        }
    };

    const handleToggleStatus = async (nextIsActive: boolean) => {
        const newStatus = nextIsActive ? 'active' : 'inactive';
        setPendingIsActive(nextIsActive);
        setIsTogglingStatus(true);
        try {
            await subscriptionApi.updateStatus(subscription.id, newStatus);
            await fetchSubscriptions();
        } catch (error: unknown) {
            Alert.alert(
                t('common.error'),
                getErrorMessage(error, t('detail.error_status_failed')),
            );
        } finally {
            setPendingIsActive(null);
            setIsTogglingStatus(false);
        }
    };

    const handleDelete = () => {
        Alert.alert(
            t('detail.delete_title', { name: subscription.service_name }),
            t('detail.delete_message'),
            [
                { text: t('billing.cancel'), style: 'cancel' },
                {
                    text: t('detail.delete_confirm'),
                    style: 'destructive',
                    onPress: async () => {
                        setIsDeleting(true);
                        try {
                            await deleteSubscription(subscription.id);
                            router.back();
                        } catch (error: unknown) {
                            setIsDeleting(false);
                            Alert.alert(
                                t('common.error'),
                                getErrorMessage(error, t('detail.error_delete_failed')),
                            );
                        }
                    },
                },
            ]
        );
    };

    const resolvePaymentMethod = () => {
        const found = paymentMethods.find(m => m.id === subscription.payment_method);
        if (found) return found.label;
        const translated = t(`payment_method.${subscription.payment_method}`, { defaultValue: '' });
        return translated || '—';
    };

    const iconUrl = subscription.icon_url;
    const presetIcon = parseSubscriptionPresetIconValue(iconUrl);

    return (
        <View className="flex-1 bg-[#F2F2F7] dark:bg-neutral-950">
            <Stack.Screen
                options={{
                    title: subscription.service_name,
                    headerShown: true,
                    headerBackTitle: ' ',
                    headerStyle: { backgroundColor: isDark ? '#0A0A0A' : '#ffffff' },
                    headerTintColor: isDark ? '#FFFFFF' : '#000000',
                    headerShadowVisible: true,
                    unstable_headerRightItems: Platform.OS === 'ios'
                        ? () => [{
                            type: 'button',
                            label: t('detail.edit_button'),
                            accessibilityLabel: t('detail.edit_button'),
                            variant: 'plain',
                            onPress: () => router.push(`/edit?id=${subscription.id}` as any),
                        }]
                        : undefined,
                    headerRight: Platform.OS === 'android'
                        ? () => (
                            <Pressable
                                accessibilityRole="button"
                                accessibilityLabel={t('detail.edit_button')}
                                onPress={() => router.push(`/edit?id=${subscription.id}` as any)}
                                style={({ pressed }) => ({
                                    width: 44,
                                    height: 44,
                                    opacity: pressed ? 0.65 : 1,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                })}
                            >
                                <MaterialIcons
                                    name="edit"
                                    size={24}
                                    color={isDark ? '#60A5FA' : '#3B82F6'}
                                />
                            </Pressable>
                        )
                        : undefined,
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
                                <FontAwesome5 name={presetIcon.name} size={44} color={presetIcon.color} />
                            ) : (
                                <Ionicons name={presetIcon.name} size={44} color={presetIcon.color} />
                            )
                        ) : iconUrl && !imageError ? (
                            <Image
                                source={{ uri: resolveIconUrl(iconUrl) }}
                                style={{ width: 80, height: 80, borderRadius: 24 }}
                                onError={() => setImageError(true)}
                            />
                        ) : (
                            <Ionicons name="cube" size={44} color="#3B82F6" />
                        )}
                    </View>
                    <Text className="text-3xl font-extrabold text-neutral-900 dark:text-white">
                        {subscription.currency === 'JPY' ? '¥' : subscription.currency}{subscription.amount.toLocaleString()}
                        <Text className="text-base font-medium text-neutral-500 dark:text-neutral-400">
                            {' '}{billingCycleSuffix}
                        </Text>
                    </Text>

                </View>

                <View className="px-4">
                    {/* Details Group */}
                    <View className="bg-white dark:bg-[#1C1C1C] rounded-xl overflow-hidden mb-6">
                        <View
                            className="px-4 flex-row justify-between items-center border-b border-neutral-200 dark:border-neutral-800"
                            style={{ minHeight: 56 }}
                        >
                            <Text className="text-neutral-500 dark:text-neutral-400 text-base">
                                {t('detail.label_status')}
                            </Text>
                            <View
                                style={{ opacity: isTogglingStatus ? 0.65 : 1 }}
                            >
                                <Switch
                                    accessibilityLabel={t('detail.label_status')}
                                    accessibilityValue={{ text: statusLabel }}
                                    value={displayedIsActive}
                                    onValueChange={(value) => void handleToggleStatus(value)}
                                    disabled={isTogglingStatus}
                                    trackColor={Platform.OS === 'android'
                                        ? {
                                            false: isDark ? '#3F3F46' : '#E4E4E7',
                                            true: isDark ? '#60A5FA' : '#3B82F6',
                                        }
                                        : undefined}
                                    thumbColor={Platform.OS === 'android'
                                        ? (displayedIsActive
                                            ? '#FFFFFF'
                                            : (isDark ? '#D4D4D8' : '#71717A'))
                                        : undefined}
                                />
                            </View>
                        </View>
                        <DetailRow label={t('detail.label_service_name')} value={subscription.service_name} />
                        <DetailRow label={t('detail.label_plan_name')} value={subscription.plan_name || '—'} />
                        <DetailRow
                            label={t('detail.label_next_payment')}
                            value={formatDateOnlyForDisplay(getEffectiveNextPaymentDate(
                                subscription.next_payment_date,
                                subscription.billing_cycle,
                                todayDate,
                                subscription.billing_anchor_day,
                            ))}
                        />
                        <DetailRow label={t('detail.label_billing_cycle')} value={t(`billing_cycle.${subscription.billing_cycle}`, { defaultValue: subscription.billing_cycle })} />
                        <DetailRow label={t('detail.label_payment_method')} value={resolvePaymentMethod()} isLast />
                    </View>

                    {/* Memo */}
                    {subscription.memo ? (
                        <View className="bg-white dark:bg-[#1C1C1C] rounded-xl overflow-hidden mb-6">
                            <View className="px-4 py-3.5">
                                <Text className="text-neutral-500 dark:text-neutral-400 text-sm mb-1">{t('detail.label_memo')}</Text>
                                <Text className="text-neutral-900 dark:text-white text-base">{subscription.memo}</Text>
                            </View>
                        </View>
                    ) : null}

                    {/* Info Group */}
                    <View className="bg-white dark:bg-[#1C1C1C] rounded-xl overflow-hidden mb-6">
                        <DetailRow label={t('detail.label_created_at')} value={formatDate(subscription.created_at || '')} />
                        <DetailRow label={t('detail.label_updated_at')} value={formatDate(subscription.updated_at || '')} isLast />
                    </View>

                    {/* Action Buttons */}
                    <Pressable
                        onPress={handleDelete}
                        disabled={isDeleting}
                        style={{ opacity: isDeleting ? 0.6 : 1 }}
                        className="items-center py-4 rounded-xl bg-white dark:bg-[#1C1C1C] border border-neutral-200/50 dark:border-white/10"
                    >
                        {isDeleting ? (
                            <ActivityIndicator size="small" color="#EF4444" />
                        ) : (
                            <Text className="text-red-600 dark:text-red-400 font-bold text-base">{t('detail.delete_button')}</Text>
                        )}
                    </Pressable>
                </View>
            </ScrollView>
        </View>
    );
}

function DetailRow({ label, value, isLast = false }: { label: string; value: string; isLast?: boolean }) {
    return (
        <View
            className={`px-4 py-3 flex-row justify-between items-center ${!isLast ? 'border-b border-neutral-200 dark:border-neutral-800' : ''
                }`}
            style={{ minHeight: 56 }}
        >
            <Text className="text-neutral-500 dark:text-neutral-400 text-base">{label}</Text>
            <Text className="text-neutral-900 dark:text-white text-base font-medium" style={{ maxWidth: '60%', textAlign: 'right' }}>{value}</Text>
        </View>
    );
}
