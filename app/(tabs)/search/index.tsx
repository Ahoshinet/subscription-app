import { SubscriptionCard } from '@/components/SubscriptionCard';
import { HOME_DARK_BACKGROUND } from '@/constants/home-theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { CURRENCY_SYMBOLS } from '@/lib/currency';
import { daysBetweenDateOnly, getEffectiveNextPaymentDate } from '@/lib/dateUtils';
import { filterSubscriptionsByQuery } from '@/lib/subscriptionSearch';
import { getTodayDateInTimeZone } from '@/lib/timeZone';
import type { Subscription } from '@/lib/api';
import { usePaidyStore } from '@/store/usePaidyStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useSubscriptionStore } from '@/store/useSubscriptionStore';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

export default function SubscriptionSearchScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const { subscriptions, isLoading, error, fetchSubscriptions } = useSubscriptionStore();
  const { timeZone } = useSettingsStore();
  const {
    isSignedIn: gmailSignedIn,
    paidyAmount,
    paidyMonth,
    nextPaymentDate: paidyNextDate,
  } = usePaidyStore();
  const todayDate = getTodayDateInTimeZone(timeZone);
  const backgroundColor = isDark ? HOME_DARK_BACKGROUND : '#FAFAFA';

  useFocusEffect(
    useCallback(() => {
      void fetchSubscriptions();
    }, [fetchSubscriptions]),
  );

  const paidyVirtualSubscription = useMemo<Subscription | null>(() => (
    gmailSignedIn && paidyAmount != null ? {
      id: -1,
      user_id: '',
      service_name: 'Paidy後払い',
      plan_name: paidyMonth ? `${paidyMonth}分` : '',
      amount: paidyAmount,
      currency: 'JPY',
      next_payment_date: paidyNextDate ?? todayDate,
      billing_cycle: 'monthly',
      payment_method: 'paidy',
      status: 'active',
    } : null
  ), [gmailSignedIn, paidyAmount, paidyMonth, paidyNextDate, todayDate]);

  const results = useMemo(() => {
    const searchableSubscriptions = paidyVirtualSubscription
      ? [...subscriptions, paidyVirtualSubscription]
      : [...subscriptions];

    return filterSubscriptionsByQuery(searchableSubscriptions, query)
      .sort((left, right) => left.next_payment_date.localeCompare(right.next_payment_date));
  }, [paidyVirtualSubscription, query, subscriptions]);
  const hasSearchableSubscriptions = subscriptions.length > 0 || paidyVirtualSubscription !== null;

  return (
    <>
      <Stack.Screen
        options={{
          contentStyle: { backgroundColor },
          headerShadowVisible: false,
          headerStyle: { backgroundColor },
          headerTintColor: isDark ? '#FFFFFF' : '#000000',
          title: t('tabs.search'),
        }}
      />
      <Stack.SearchBar
        allowToolbarIntegration
        autoCapitalize="none"
        hideWhenScrolling={false}
        obscureBackground={false}
        onCancelButtonPress={() => setQuery('')}
        onChangeText={(event) => setQuery(event.nativeEvent.text)}
        placeholder={t('home.search_placeholder')}
        placement="automatic"
      />

      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 120 }}
        keyboardShouldPersistTaps="handled"
        style={{ backgroundColor }}
      >
        {error ? (
          <View className="bg-red-100 dark:bg-red-900/30 p-4 rounded-xl mb-6 border border-red-200 dark:border-red-900/50">
            <Text className="text-red-600 dark:text-red-400 font-medium">
              {t('home.error_load', { error })}
            </Text>
          </View>
        ) : null}

        {isLoading && subscriptions.length === 0 ? (
          <View className="py-10 items-center">
            <ActivityIndicator size="large" color="#3B82F6" />
          </View>
        ) : null}

        {!isLoading && !hasSearchableSubscriptions && !error ? (
          <View className="py-10 items-center">
            <Text className="text-neutral-500 dark:text-neutral-400 font-medium">
              {t('home.empty')}
            </Text>
          </View>
        ) : null}

        {hasSearchableSubscriptions && query.trim() && results.length === 0 ? (
          <View className="py-10 items-center">
            <Text className="text-neutral-500 dark:text-neutral-400 font-medium">
              {t('home.no_results')}
            </Text>
          </View>
        ) : null}

        {results.map((subscription) => {
          const effectiveDate = subscription.id === -1
            ? subscription.next_payment_date
            : getEffectiveNextPaymentDate(
              subscription.next_payment_date,
              subscription.billing_cycle,
              todayDate,
              subscription.billing_anchor_day,
            );
          const daysRemaining = Math.max(0, daysBetweenDateOnly(todayDate, effectiveDate));

          return (
            <SubscriptionCard
              amount={subscription.amount}
              billingCycle={subscription.billing_cycle}
              color={subscription.id === -1 ? '#1A56DB' : '#3B82F6'}
              currency={CURRENCY_SYMBOLS[subscription.currency] || subscription.currency}
              daysRemaining={daysRemaining}
              iconName={subscription.id === -1 ? 'card' : 'cube'}
              iconUrl={subscription.id === -1 ? undefined : subscription.icon_url}
              id={subscription.id}
              key={subscription.id}
              onPress={subscription.id === -1 ? () => router.push('/paidy-detail') : undefined}
              planName={subscription.plan_name || t('home.standard_plan')}
              serviceName={subscription.service_name}
              status={subscription.status}
            />
          );
        })}
      </ScrollView>
    </>
  );
}
