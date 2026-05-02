import { View, Text, ScrollView, Pressable, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { usePaidyStore } from '@/store/usePaidyStore';

export default function PaidyDetailScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const { t } = useTranslation();

  const {
    googleEmail,
    paidyAmount,
    paidyMonth,
    nextPaymentDate,
    transactions,
    lastSyncedAt,
    isLoading,
    error,
    syncPaidy,
    clearError,
  } = usePaidyStore();

  const handleSync = async () => {
    await syncPaidy();
  };

  if (error) {
    Alert.alert(t('common.error'), t('gmail.error_sync'));
    clearError();
  }

  return (
    <SafeAreaView className="flex-1 bg-neutral-50 dark:bg-neutral-950">
      {/* Header */}
      <View className="flex-row items-center px-5 pt-4 pb-2">
        <Pressable onPress={() => router.back()} className="mr-3">
          <Ionicons name="chevron-down" size={28} color={isDark ? '#fff' : '#111'} />
        </Pressable>
        <Text className="text-2xl font-bold text-neutral-900 dark:text-white flex-1">
          {t('paidy_detail.title')}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Amount card */}
        <View className="bg-white dark:bg-[#1C1C1E] rounded-3xl p-6 mb-4 border border-neutral-200 dark:border-white/10">
          <View className="flex-row items-center mb-1">
            <View className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 items-center justify-center mr-3">
              <Ionicons name="card" size={22} color="#1A56DB" />
            </View>
            <Text className="text-base font-semibold text-neutral-500 dark:text-neutral-400">
              {t('paidy_detail.total_amount')}
            </Text>
          </View>
          <Text className="text-4xl font-extrabold text-neutral-900 dark:text-white mt-2">
            ¥{paidyAmount != null ? paidyAmount.toLocaleString() : '—'}
          </Text>
          {paidyMonth && (
            <Text className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
              {t('paidy_detail.month')}: {paidyMonth}
            </Text>
          )}
          {nextPaymentDate && (
            <Text className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
              {t('paidy_detail.next_payment')}: {nextPaymentDate}
            </Text>
          )}
        </View>

        {/* Transactions */}
        {transactions.length > 0 && (
          <View className="mb-4">
            <Text className="text-base font-bold text-neutral-500 dark:text-neutral-400 mb-2 ml-1">
              {t('paidy_detail.transactions')}
            </Text>
            <View className="bg-white dark:bg-[#1C1C1E] rounded-2xl overflow-hidden border border-neutral-200 dark:border-white/10">
              {transactions.map((tx, idx) => (
                <View
                  key={idx}
                  className={`flex-row items-center justify-between px-4 py-3 ${idx < transactions.length - 1 ? 'border-b border-neutral-100 dark:border-white/5' : ''}`}
                >
                  <View className="flex-1 mr-4">
                    <Text className="text-base font-medium text-neutral-900 dark:text-white" numberOfLines={1}>
                      {tx.merchant || '不明'}
                    </Text>
                    <Text className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">
                      {tx.date}
                    </Text>
                  </View>
                  <Text className="text-base font-bold text-neutral-900 dark:text-white">
                    ¥{tx.amount.toLocaleString()}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Meta info */}
        <View className="bg-white dark:bg-[#1C1C1E] rounded-2xl overflow-hidden border border-neutral-200 dark:border-white/10 mb-6">
          <View className="flex-row items-center justify-between px-4 py-3 border-b border-neutral-100 dark:border-white/5">
            <Text className="text-base text-neutral-500 dark:text-neutral-400">
              {t('paidy_detail.connected_account')}
            </Text>
            <Text className="text-sm font-medium text-neutral-900 dark:text-white" numberOfLines={1}>
              {googleEmail ?? '—'}
            </Text>
          </View>
          <View className="flex-row items-center justify-between px-4 py-3">
            <Text className="text-base text-neutral-500 dark:text-neutral-400">
              {t('gmail.last_synced', { datetime: lastSyncedAt ? new Date(lastSyncedAt).toLocaleString('ja-JP') : '—' })}
            </Text>
          </View>
        </View>

        {/* Actions */}
        <Pressable
          onPress={handleSync}
          disabled={isLoading}
          className="items-center py-4 rounded-xl bg-blue-500 mb-3"
        >
          {isLoading
            ? <ActivityIndicator color="#fff" />
            : <Text className="text-white font-bold text-base">{t('gmail.sync_now')}</Text>
          }
        </Pressable>

        <Pressable
          onPress={() => router.push('/settings/gmail' as any)}
          className="items-center py-4 rounded-xl bg-neutral-100 dark:bg-white/10"
        >
          <Text className="text-neutral-700 dark:text-neutral-300 font-semibold text-base">
            {t('gmail.open_settings')}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
