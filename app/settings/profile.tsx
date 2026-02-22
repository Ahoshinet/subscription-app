import React from 'react';
import { View, Text, useColorScheme } from 'react-native';
import { Stack } from 'expo-router';

export default function ProfileScreen() {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    return (
        <>
            <Stack.Screen
                options={{
                    title: 'Profile',
                    headerBackTitle: 'Settings',
                    headerStyle: { backgroundColor: isDark ? '#000000' : '#ffffff' },
                    headerTintColor: isDark ? '#ffffff' : '#000000',
                }}
            />
            <View className="flex-1 bg-neutral-50 dark:bg-black items-center justify-center p-6">
                <Text className="text-xl font-bold text-neutral-900 dark:text-white mb-2">
                    Profile Settings
                </Text>
                <Text className="text-center text-neutral-500 dark:text-neutral-400">
                    This is a placeholder for the user profile form. Account details will be editable here once connected to the backend.
                </Text>
            </View>
        </>
    );
}
