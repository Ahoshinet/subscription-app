import { View, Text, ScrollView, Pressable, ActivityIndicator, RefreshControl, TextInput, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { SubscriptionCard } from '@/components/SubscriptionCard';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import MenuView from '@expo/ui/community/menu';
import { useRouter, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSubscriptionStore } from '@/store/useSubscriptionStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { usePaidyStore } from '@/store/usePaidyStore';
import { requestNotificationPermissions, schedulePaymentReminders, cancelAllReminders } from '@/lib/notifications';
import * as Haptics from 'expo-haptics';

import { CURRENCY_SYMBOLS, getSystemCurrency, toMonthlyAmount } from '@/lib/currency';
import { daysBetweenDateOnly, getEffectiveNextPaymentDate } from '@/lib/dateUtils';
import { getErrorMessage } from '@/lib/errors';
import { getTodayDateInTimeZone } from '@/lib/timeZone';
import { singleLineTextInputStyle } from '@/lib/textInputStyles';
import { subscriptionApi, type Subscription } from '@/lib/api';
import { HOME_DARK_BACKGROUND } from '@/constants/home-theme';
import { filterSubscriptionsByQuery } from '@/lib/subscriptionSearch';

type SortKey = 'name' | 'amount' | 'date';

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const { t } = useTranslation();

  const { subscriptions, isLoading, error, fetchSubscriptions, deleteSubscription } = useSubscriptionStore();
  const { pushNotifications, timeZone } = useSettingsStore();
  const { isSignedIn: gmailSignedIn, paidyAmount, paidyMonth, nextPaymentDate: paidyNextDate } = usePaidyStore();
  const [refreshing, setRefreshing] = useState(false);
  const [spendingExpanded, setSpendingExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [showInactive, setShowInactive] = useState(true);
  const [actionInFlightId, setActionInFlightId] = useState<number | null>(null);
  const todayDate = getTodayDateInTimeZone(timeZone);

  useFocusEffect(
    useCallback(() => {
      void fetchSubscriptions();
    }, [fetchSubscriptions])
  );

  // Schedule payment reminder notifications
  useEffect(() => {
    let cancelled = false;
    if (subscriptions.length > 0 && pushNotifications) {
      void (async () => {
        const granted = await requestNotificationPermissions();
        if (granted && !cancelled) {
          schedulePaymentReminders(subscriptions, t, timeZone);
        }
      })();
    } else {
      void cancelAllReminders();
    }
    return () => {
      cancelled = true;
    };
  }, [subscriptions, pushNotifications, timeZone, t]);

  const onRefresh = useCallback(async () => {
    if (process.env.EXPO_OS === 'ios') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setRefreshing(true);
    await fetchSubscriptions();
    setRefreshing(false);
  }, [fetchSubscriptions]);

  const handleToggleStatus = useCallback(async (id: number, currentStatus: string) => {
    if (actionInFlightId !== null) return;

    setActionInFlightId(id);
    try {
      const nextStatus = currentStatus === 'inactive' ? 'active' : 'inactive';
      await subscriptionApi.updateStatus(id, nextStatus);
      await fetchSubscriptions();
    } catch (error: unknown) {
      Alert.alert(
        t('common.error'),
        getErrorMessage(error, t('detail.error_status_failed')),
      );
    } finally {
      setActionInFlightId(null);
    }
  }, [actionInFlightId, fetchSubscriptions, t]);

  const handleDelete = useCallback((id: number, serviceName: string) => {
    Alert.alert(
      t('detail.delete_title', { name: serviceName }),
      t('detail.delete_message'),
      [
        { text: t('billing.cancel'), style: 'cancel' },
        {
          text: t('detail.delete_confirm'),
          style: 'destructive',
          onPress: () => {
            if (actionInFlightId !== null) return;

            setActionInFlightId(id);
            void deleteSubscription(id)
              .catch((error: unknown) => {
                Alert.alert(
                  t('common.error'),
                  getErrorMessage(error, t('detail.error_delete_failed')),
                );
              })
              .finally(() => {
                setActionInFlightId(null);
              });
          },
        },
      ]
    );
  }, [actionInFlightId, deleteSubscription, t]);

  // Memoized: these were rebuilt on every render, giving the downstream
  // filteredAndSorted useMemo a fresh paidyVirtualSub identity each time.
  const paidyVirtualSub = useMemo<Subscription | null>(() => (
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

  const { sortedCurrencies, primaryEntry, otherCount } = useMemo(() => {
    const spendingByCurrency = subscriptions
      .filter(sub => sub.status === 'active')
      .reduce<Record<string, number>>((acc, sub) => {
        const curr = sub.currency || 'JPY';
        acc[curr] = (acc[curr] || 0) + toMonthlyAmount(Number(sub.amount || 0), sub.billing_cycle);
        return acc;
      }, {});
    if (gmailSignedIn && paidyAmount != null) {
      spendingByCurrency['JPY'] = (spendingByCurrency['JPY'] || 0) + paidyAmount;
    }
    const systemCurrency = getSystemCurrency();
    const sorted = Object.entries(spendingByCurrency).sort(([a], [b]) => {
      if (a === systemCurrency) return -1;
      if (b === systemCurrency) return 1;
      return spendingByCurrency[b] - spendingByCurrency[a];
    });
    return {
      sortedCurrencies: sorted,
      primaryEntry: sorted[0],
      otherCount: sorted.length - 1,
    };
  }, [subscriptions, gmailSignedIn, paidyAmount]);

  // The stored next_payment_date is an anchor that isn't rolled forward on
  // its own, so a subscription can go stale (e.g. still 2024-10-01) while
  // its actual upcoming charge is months away. Sorting/day-count math must
  // use this resolved date, not the raw field, or a stale anchor sorts as
  // if it were the earliest upcoming payment.
  const effectiveDateFor = useCallback((sub: Subscription): string => (
    sub.id === -1
      ? sub.next_payment_date
      : getEffectiveNextPaymentDate(sub.next_payment_date, sub.billing_cycle, todayDate, sub.billing_anchor_day)
  ), [todayDate]);

  const filteredAndSorted = useMemo(() => {
    let result: Subscription[] = paidyVirtualSub
      ? [...subscriptions, paidyVirtualSub]
      : [...subscriptions];

    result = filterSubscriptionsByQuery(result, searchQuery);

    if (!showInactive) {
      result = result.filter(sub => sub.status !== 'inactive');
    }

    result.sort((a, b) => {
      switch (sortKey) {
        case 'name':
          return a.service_name.localeCompare(b.service_name);
        case 'amount':
          return b.amount - a.amount;
        case 'date':
        default:
          return effectiveDateFor(a).localeCompare(effectiveDateFor(b));
      }
    });

    return result;
  }, [subscriptions, paidyVirtualSub, searchQuery, sortKey, showInactive, effectiveDateFor]);


  const sortLabel = () => {
    switch (sortKey) {
      case 'name': return t('home.sort_name');
      case 'amount': return t('home.sort_amount');
      case 'date': return t('home.sort_date');
    }
  };

  return (
    <SafeAreaView
      edges={Platform.OS === 'ios' ? ['top', 'left', 'right'] : undefined}
      className="flex-1 bg-neutral-50 dark:bg-neutral-950"
      style={{ backgroundColor: isDark ? HOME_DARK_BACKGROUND : '#fafafa' }}
    >
      <StatusBar style="auto" />
      <ScrollView
        contentContainerStyle={{ padding: 20 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={isDark ? '#60A5FA' : '#3B82F6'}
          />
        }
      >
        <View className="mt-8 mb-6 flex-row justify-between items-start">
          <View>
            <Text className="text-4xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
              {t('home.title')}
            </Text>
            <View>
              <Pressable
                onPress={() => otherCount > 0 && setSpendingExpanded(v => !v)}
                className="flex-row items-center"
              >
                <Text className="text-base text-neutral-500 dark:text-neutral-400 mt-2 font-medium">
                  {!primaryEntry
                    ? t('home.monthly_spending', { amount: '¥0' })
                    : otherCount > 0
                      ? t('home.monthly_spending_multi', {
                          amount: `${CURRENCY_SYMBOLS[primaryEntry[0]] || primaryEntry[0]}${Math.round(primaryEntry[1]).toLocaleString()}`,
                          count: otherCount,
                        })
                      : t('home.monthly_spending', {
                          amount: `${CURRENCY_SYMBOLS[primaryEntry[0]] || primaryEntry[0]}${Math.round(primaryEntry[1]).toLocaleString()}`,
                        })
                  }
                </Text>
                {otherCount > 0 && (
                  <Ionicons
                    name={spendingExpanded ? 'chevron-up' : 'chevron-down'}
                    size={14}
                    color={isDark ? '#71717A' : '#A1A1AA'}
                    style={{ marginTop: 8, marginLeft: 4 }}
                  />
                )}
              </Pressable>
              {spendingExpanded && (
                <View className="mt-1">
                  {sortedCurrencies.map(([curr, total]) => (
                    <Text key={curr} className="text-sm text-neutral-400 dark:text-neutral-500 ml-1">
                      {CURRENCY_SYMBOLS[curr] || curr}{Math.round(total).toLocaleString()} ({curr})
                    </Text>
                  ))}
                </View>
              )}
            </View>
          </View>

          <Pressable
            onPress={() => router.push('/add')}
            accessibilityRole="button"
            accessibilityLabel={t('add.title')}
            className={
              Platform.OS === 'ios'
                ? 'w-16 h-11 bg-blue-500 rounded-full items-center justify-center'
                : 'w-16 h-11 bg-blue-500 rounded-full items-center justify-center shadow-lg shadow-blue-500/30'
            }
          >
            <Ionicons name="add" size={28} color="#ffffff" />
          </Pressable>
        </View>

        {/* Search & Sort */}
        {subscriptions.length > 0 && (
          <View className="mb-4">
            {Platform.OS !== 'ios' ? (
              <View className="bg-white dark:bg-[#1C1C1E] rounded-xl flex-row items-center px-3 mb-3" style={{ height: 44 }}>
                <Ionicons name="search" size={18} color={isDark ? '#6B7280' : '#9CA3AF'} />
                <TextInput
                  placeholder={t('home.search_placeholder')}
                  placeholderTextColor={isDark ? '#52525B' : '#A1A1AA'}
                  className="flex-1 text-base text-neutral-900 dark:text-white ml-2"
                  style={[{ height: 44 }, singleLineTextInputStyle]}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoCorrect={false}
                />
                {searchQuery.length > 0 && (
                  <Pressable onPress={() => setSearchQuery('')}>
                    <Ionicons name="close-circle" size={18} color={isDark ? '#6B7280' : '#9CA3AF'} />
                  </Pressable>
                )}
              </View>
            ) : null}
            <MenuView
              onPressAction={({ nativeEvent: { event } }) => {
                if (event === 'toggle-inactive') {
                  setShowInactive(v => !v);
                  return;
                }
                setSortKey(event as SortKey);
              }}
              actions={[
                { id: 'date', title: t('home.sort_date'), image: 'calendar', state: sortKey === 'date' ? 'on' : 'off' },
                { id: 'name', title: t('home.sort_name'), image: 'textformat', state: sortKey === 'name' ? 'on' : 'off' },
                { id: 'amount', title: t('home.sort_amount'), image: 'banknote', state: sortKey === 'amount' ? 'on' : 'off' },
                {
                  id: 'filters',
                  title: '',
                  displayInline: true,
                  subactions: [
                    {
                      id: 'toggle-inactive',
                      title: t('home.show_inactive'),
                      image: 'eye',
                      state: showInactive ? 'on' : 'off',
                    },
                  ],
                },
              ]}
              style={{ alignSelf: 'flex-end' }}
            >
              <View className="flex-row items-center">
                <Ionicons name="swap-vertical" size={16} color={isDark ? '#6B7280' : '#9CA3AF'} />
                <Text className="text-sm text-neutral-500 dark:text-neutral-400 ml-1">
                  {sortLabel()}
                </Text>
              </View>
            </MenuView>
          </View>
        )}

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
        ) : (
          <>
            {subscriptions.length === 0 && !error && (
              <View className="py-10 items-center">
                <Text className="text-neutral-500 dark:text-neutral-400 font-medium">
                  {t('home.empty')}
                </Text>
              </View>
            )}

            {filteredAndSorted.length === 0 && subscriptions.length > 0 && searchQuery.trim() && (
              <View className="py-10 items-center">
                <Text className="text-neutral-500 dark:text-neutral-400 font-medium">
                  {t('home.no_results')}
                </Text>
              </View>
            )}

            {filteredAndSorted.map((sub) => {
              const daysRemaining = Math.max(0, daysBetweenDateOnly(todayDate, effectiveDateFor(sub)));

              return (
                <SubscriptionCard
                  key={sub.id}
                  id={sub.id}
                  serviceName={sub.service_name}
                  planName={sub.plan_name || t('home.standard_plan')}
                  amount={sub.amount}
                  currency={CURRENCY_SYMBOLS[sub.currency] || sub.currency}
                  billingCycle={sub.billing_cycle}
                  daysRemaining={daysRemaining}
                  color={sub.id === -1 ? '#1A56DB' : '#3B82F6'}
                  iconName={sub.id === -1 ? 'card' : 'cube'}
                  iconUrl={sub.id === -1 ? undefined : sub.icon_url}
                  status={sub.status}
                  onPress={sub.id === -1 ? () => router.push('/paidy-detail') : undefined}
                  onEdit={sub.id === -1
                    ? undefined
                    : () => router.push({ pathname: '/edit', params: { id: String(sub.id) } })}
                  onToggleStatus={sub.id === -1
                    ? undefined
                    : () => void handleToggleStatus(sub.id, sub.status)}
                  onDelete={sub.id === -1
                    ? undefined
                    : () => handleDelete(sub.id, sub.service_name)}
                  actionsDisabled={actionInFlightId !== null}
                />
              );
            })}
          </>
        )}

        <View className="mt-8 pb-32 items-center">
          <Text className="text-sm font-medium text-neutral-400 dark:text-neutral-600">
            {t('home.end_of_list')}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
