import React from 'react';
import { View, Text, SafeAreaView, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function CalendarScreen() {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    return (
        <SafeAreaView className="flex-1 bg-neutral-50 dark:bg-neutral-950">
            <View className="flex-1 justify-center items-center px-6">
                <Ionicons name="calendar-outline" size={64} color={isDark ? '#3B82F6' : '#3B82F6'} />
                <Text className="text-2xl font-bold text-neutral-900 dark:text-white mt-4 mb-2">
                    Subscription Calendar
                </Text>
                <Text className="text-center text-neutral-500 dark:text-neutral-400">
                    A calendar view of your upcoming payments will be displayed here.
                </Text>
            </View>
        </SafeAreaView>
    );
}
