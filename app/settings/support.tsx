import React from 'react';
import { View, Text, useColorScheme } from 'react-native';
import { Stack } from 'expo-router';

export default function SupportScreen() {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    return (
        <>
            <Stack.Screen
                options={{
                    title: 'Help & Support',
                    headerBackTitle: 'Settings',
                    headerStyle: { backgroundColor: isDark ? '#000000' : '#ffffff' },
                    headerTintColor: isDark ? '#ffffff' : '#000000',
                }}
            />
            <View className="flex-1 bg-neutral-50 dark:bg-black items-center justify-center p-6">
                <Text className="text-xl font-bold text-neutral-900 dark:text-white mb-2">
                    Help & Support
                </Text>
                <Text className="text-center text-neutral-500 dark:text-neutral-400">
                    This is a placeholder for the contact or FAQ page.
                </Text>
            </View>
        </>
    );
}
