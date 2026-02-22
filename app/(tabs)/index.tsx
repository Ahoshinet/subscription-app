import { StyleSheet, View, Text, ScrollView, Platform, SafeAreaView } from 'react-native';
import { SubscriptionCard } from '@/components/SubscriptionCard';
import { StatusBar } from 'expo-status-bar';

export default function HomeScreen() {
  return (
    <SafeAreaView className="flex-1 bg-neutral-50 dark:bg-neutral-950">
      <StatusBar style="auto" />
      <ScrollView
        contentContainerStyle={{ padding: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="mt-8 mb-10">
          <Text className="text-4xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
            My Subscriptions
          </Text>
          <Text className="text-base text-neutral-500 dark:text-neutral-400 mt-2 font-medium">
            You are spending ¥5,260 this month
          </Text>
        </View>

        {/* Dummy Data Showcase */}
        <SubscriptionCard
          serviceName="Netflix"
          planName="Premium Plan"
          amount={1980}
          nextPaymentDate="2026-03-01T00:00:00Z"
          daysRemaining={7}
          color="#E50914"
          iconName="film"
        />

        <SubscriptionCard
          serviceName="Spotify"
          planName="Individual"
          amount={980}
          nextPaymentDate="2026-02-25T00:00:00Z"
          daysRemaining={3}
          color="#1DB954"
          iconName="musical-notes"
        />

        <SubscriptionCard
          serviceName="Adobe CC"
          planName="Creative Cloud All Apps"
          amount={2300}
          nextPaymentDate="2026-03-10T00:00:00Z"
          daysRemaining={16}
          color="#FF0000"
          iconName="color-palette"
        />

        <View className="mt-8 mb-10 items-center">
          <Text className="text-sm font-medium text-neutral-400 dark:text-neutral-600">
            End of list
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
