import React from 'react';
import { View, Text, Pressable, useColorScheme, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';

export default function AddSubscriptionModal() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    return (
        <KeyboardAvoidingView
            className="flex-1 bg-neutral-100 dark:bg-neutral-900"
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            {/* Custom Modal Header mimicking Apple Mail compose screen */}
            <View className="flex-row justify-between items-center px-4 py-4 bg-white dark:bg-[#1C1C1E] border-b border-neutral-200 dark:border-white/10">
                <Pressable
                    onPress={() => router.back()}
                    className="px-2 py-1"
                >
                    <Text className="text-lg text-blue-500 dark:text-blue-400">
                        Cancel
                    </Text>
                </Pressable>

                <Text className="text-lg font-bold text-neutral-900 dark:text-white">
                    New Subscription
                </Text>

                <Pressable
                    onPress={() => {
                        // Save logic here later
                        router.back();
                    }}
                    className="px-2 py-1"
                >
                    <Text className="text-lg font-bold text-blue-500 dark:text-blue-400">
                        Add
                    </Text>
                </Pressable>
            </View>

            <ScrollView className="flex-1 px-4 py-6" showsVerticalScrollIndicator={false}>
                <Text className="text-center text-neutral-500 dark:text-neutral-400 mt-4">
                    This is a placeholder for the future subscription creation form where you can enter the Service Name, Amount, Billing Cycle, etc.
                </Text>
                {/* We will add NativeWind styled TextInputs and SettingsRow-like rows here in Phase 4 */}
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
