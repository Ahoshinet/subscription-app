import { View, Text, ScrollView, SafeAreaView, Pressable, ActivityIndicator } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { SubscriptionCard } from '@/components/SubscriptionCard';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { useSubscriptionStore } from '@/store/useSubscriptionStore';

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();

  const { subscriptions, isLoading, error, fetchSubscriptions } = useSubscriptionStore();

  useFocusEffect(
    useCallback(() => {
      fetchSubscriptions();
    }, [])
  );

  const totalMonthlySpent = subscriptions
    .filter(sub => sub.status === 'active') // Assuming you have active status
    .reduce((total, sub) => {
      // Simple total calculation for now. Could be adjusted based on billing_cycle
      return total + Number(sub.amount || 0);
    }, 0);

  return (
    <SafeAreaView className="flex-1 bg-neutral-50 dark:bg-neutral-950">
      <StatusBar style="auto" />
      <ScrollView
        contentContainerStyle={{ padding: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="mt-8 mb-10 flex-row justify-between items-start">
          <View>
            <Text className="text-4xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
              My Subscriptions
            </Text>
            <Text className="text-base text-neutral-500 dark:text-neutral-400 mt-2 font-medium">
              You are spending ¥{totalMonthlySpent.toLocaleString()} this month
            </Text>
          </View>

          <Pressable
            onPress={() => router.push('/add')}
            className="w-12 h-12 bg-blue-500 rounded-full items-center justify-center shadow-lg shadow-blue-500/30"
          >
            <Ionicons name="add" size={28} color="#ffffff" />
          </Pressable>
        </View>

        {error ? (
          <View className="bg-red-100 dark:bg-red-900/30 p-4 rounded-xl mb-6 border border-red-200 dark:border-red-900/50">
            <Text className="text-red-600 dark:text-red-400 font-medium">
              Failed to load: {error}
              {'\n'}Make sure the Rust backend is running & auth token is set.
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
                  No subscriptions found. Tap the + to add one.
                </Text>
              </View>
            )}

            {subscriptions.map((sub) => {
              // Calculate rough days remaining logic or default to next_payment_date diff
              const nextPaymentDate = new Date(sub.next_payment_date);
              const diffTime = Math.abs(nextPaymentDate.getTime() - new Date().getTime());
              const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

              return (
                <SubscriptionCard
                  key={sub.id}
                  id={sub.id}
                  serviceName={sub.service_name}
                  planName={sub.plan_name || 'Standard Plan'}
                  amount={sub.amount}
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
            End of list
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
