import React from 'react';
import { View, Text, useColorScheme, ScrollView } from 'react-native';
import { Stack } from 'expo-router';

export default function TosScreen() {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    return (
        <>
            <Stack.Screen
                options={{
                    title: 'Terms of Service',
                    headerBackTitle: 'Settings',
                    headerStyle: { backgroundColor: isDark ? '#000000' : '#ffffff' },
                    headerTintColor: isDark ? '#ffffff' : '#000000',
                }}
            />
            <View className="flex-1 bg-neutral-50 dark:bg-black pt-6">
                <ScrollView className="flex-1 px-6">
                    <Text className="text-2xl font-bold text-neutral-900 dark:text-white mb-4">
                        Terms of Service
                    </Text>
                    <Text className="text-base text-neutral-700 dark:text-neutral-300 leading-relaxed mb-4">
                        1. Introduction
                        {"\n\n"}
                        This is a placeholder for the application's terms of service and privacy policy. Real legal text will be placed here before production release.
                    </Text>
                    <Text className="text-base text-neutral-700 dark:text-neutral-300 leading-relaxed pb-10">
                        2. User Data handling
                        {"\n\n"}
                        All subscription data is synced securely. You have the right to delete your account at any time.
                    </Text>
                </ScrollView>
            </View>
        </>
    );
}
