import { View, Text, ScrollView, SafeAreaView, Pressable, ActivityIndicator, RefreshControl, TextInput } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { SubscriptionCard } from '@/components/SubscriptionCard';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSubscriptionStore } from '@/store/useSubscriptionStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { requestNotificationPermissions, schedulePaymentReminders, cancelAllReminders } from '@/lib/notifications';

import { CURRENCY_SYMBOLS, getSystemCurrency } from '@/lib/currency';

type SortKey = 'name' | 'amount' | 'date';

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const { t } = useTranslation();

  const { subscriptions, isLoading, error, fetchSubscriptions } = useSubscriptionStore();
  const { pushNotifications } = useSettingsStore();
  const [refreshing, setRefreshing] = useState(false);
  const [spendingExpanded, setSpendingExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('date');

  useFocusEffect(
    useCallback(() => {
      fetchSubscriptions();
    }, [])
  );

  // Schedule payment reminder notifications
  useEffect(() => {
    if (subscriptions.length > 0 && pushNotifications) {
      (async () => {
        const granted = await requestNotificationPermissions();
        if (granted) {
          await schedulePaymentReminders(subscriptions, t);
        }
      })();
    } else if (!pushNotifications) {
      cancelAllReminders();
    }
  }, [subscriptions, pushNotifications]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchSubscriptions();
    setRefreshing(false);
  }, [fetchSubscriptions]);

  const spendingByCurrency = subscriptions
    .filter(sub => sub.status === 'active')
    .reduce<Record<string, number>>((acc, sub) => {
      const curr = sub.currency || 'JPY';
      acc[curr] = (acc[curr] || 0) + Number(sub.amount || 0);
      return acc;
    }, {});
  const systemCurrency = getSystemCurrency();
  const sortedCurrencies = Object.entries(spendingByCurrency).sort(([a], [b]) => {
    if (a === systemCurrency) return -1;
    if (b === systemCurrency) return 1;
    return spendingByCurrency[b] - spendingByCurrency[a];
  });
  const primaryEntry = sortedCurrencies[0];
  const otherCount = sortedCurrencies.length - 1;

  const filteredAndSorted = useMemo(() => {
    let result = [...subscriptions];

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(sub =>
        sub.service_name.toLowerCase().includes(q) ||
        (sub.plan_name && sub.plan_name.toLowerCase().includes(q))
      );
    }

    // Sort
    result.sort((a, b) => {
      switch (sortKey) {
        case 'name':
          return a.service_name.localeCompare(b.service_name);
        case 'amount':
          return b.amount - a.amount;
        case 'date':
        default:
          return new Date(a.next_payment_date).getTime() - new Date(b.next_payment_date).getTime();
      }
    });

    return result;
  }, [subscriptions, searchQuery, sortKey]);


  const nextSortKey = (): SortKey => {
    if (sortKey === 'date') return 'name';
    if (sortKey === 'name') return 'amount';
    return 'date';
  };

  const sortLabel = () => {
    switch (sortKey) {
      case 'name': return t('home.sort_name');
      case 'amount': return t('home.sort_amount');
      case 'date': return t('home.sort_date');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-neutral-50 dark:bg-neutral-950">
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
                          amount: `${CURRENCY_SYMBOLS[primaryEntry[0]] || primaryEntry[0]}${primaryEntry[1].toLocaleString()}`,
                          count: otherCount,
                        })
                      : t('home.monthly_spending', {
                          amount: `${CURRENCY_SYMBOLS[primaryEntry[0]] || primaryEntry[0]}${primaryEntry[1].toLocaleString()}`,
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
                      {CURRENCY_SYMBOLS[curr] || curr}{total.toLocaleString()} ({curr})
                    </Text>
                  ))}
                </View>
              )}
            </View>
          </View>

          <Pressable
            onPress={() => router.push('/add')}
            className="w-16 h-11 bg-blue-500 rounded-full items-center justify-center shadow-lg shadow-blue-500/30"
          >
            <Ionicons name="add" size={28} color="#ffffff" />
          </Pressable>
        </View>

        {/* Search & Sort */}
        {subscriptions.length > 0 && (
          <View className="mb-4">
            <View className="bg-white dark:bg-[#1C1C1E] rounded-xl flex-row items-center px-3 mb-3" style={{ height: 44 }}>
              <Ionicons name="search" size={18} color={isDark ? '#6B7280' : '#9CA3AF'} />
              <TextInput
                placeholder={t('home.search_placeholder')}
                placeholderTextColor={isDark ? '#52525B' : '#A1A1AA'}
                className="flex-1 text-base text-neutral-900 dark:text-white ml-2"
                style={{ height: 44, paddingTop: 0, paddingBottom: 0 }}
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
            <Pressable
              onPress={() => setSortKey(nextSortKey())}
              className="flex-row items-center self-end"
            >
              <Ionicons name="swap-vertical" size={16} color={isDark ? '#6B7280' : '#9CA3AF'} />
              <Text className="text-sm text-neutral-500 dark:text-neutral-400 ml-1">
                {sortLabel()}
              </Text>
            </Pressable>
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
              const nextPaymentDate = new Date(sub.next_payment_date);
              const diffTime = nextPaymentDate.getTime() - new Date().getTime();
              const daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

              return (
                <SubscriptionCard
                  key={sub.id}
                  id={sub.id}
                  serviceName={sub.service_name}
                  planName={sub.plan_name || t('home.standard_plan')}
                  amount={sub.amount}
                  currency={CURRENCY_SYMBOLS[sub.currency] || sub.currency}
                  nextPaymentDate={sub.next_payment_date}
                  daysRemaining={daysRemaining}
                  color="#3B82F6"
                  iconName="cube"
                  iconUrl={(sub as any).icon_url}
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
