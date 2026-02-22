import { View, Text, ScrollView, SafeAreaView, Pressable, useColorScheme } from 'react-native';
import { SubscriptionCard } from '@/components/SubscriptionCard';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useRef } from 'react';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const bottomSheetRef = useRef<BottomSheet>(null);

  const handleOpenSheet = useCallback(() => {
    bottomSheetRef.current?.expand();
  }, []);

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
              You are spending ¥5,260 this month
            </Text>
          </View>

          <Pressable
            onPress={handleOpenSheet}
            className="w-12 h-12 bg-blue-500 rounded-full items-center justify-center shadow-lg shadow-blue-500/30"
          >
            <Ionicons name="add" size={28} color="#ffffff" />
          </Pressable>
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

        <View className="mt-8 pb-32 items-center">
          <Text className="text-sm font-medium text-neutral-400 dark:text-neutral-600">
            End of list
          </Text>
        </View>
      </ScrollView>

      {/* Global Add Item Bottom Sheet Placeholder */}
      <BottomSheet
        ref={bottomSheetRef}
        index={-1} // Closed by default
        snapPoints={['50%', '90%']}
        enablePanDownToClose={true}
        backgroundStyle={{
          backgroundColor: isDark ? '#1c1c1e' : '#ffffff',
        }}
        handleIndicatorStyle={{
          backgroundColor: isDark ? '#ffffff50' : '#00000050',
        }}
      >
        <BottomSheetView className="p-6 flex-1">
          <Text className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">
            Add Subscription
          </Text>
          <Text className="text-neutral-500 dark:text-neutral-400">
            This is a placeholder for the future subscription creation form.
          </Text>
        </BottomSheetView>
      </BottomSheet>
    </SafeAreaView>
  );
}
