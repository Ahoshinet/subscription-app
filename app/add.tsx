import React from 'react';
import { View, Text, TextInput, Pressable, useColorScheme } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function AddSubscriptionModal() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    return (
        <>
            <Stack.Screen
                options={{
                    title: '新規登録',
                    headerBackVisible: false,
                    headerLeft: () => (
                        <Pressable onPress={() => router.back()} className="px-2">
                            <Text className="text-blue-500 dark:text-blue-400 text-lg font-normal">キャンセル</Text>
                        </Pressable>
                    ),
                    headerRight: () => (
                        <Pressable onPress={() => router.back()} className="px-2">
                            <Text className="text-blue-500 dark:text-blue-400 text-lg font-semibold">追加</Text>
                        </Pressable>
                    ),
                    headerStyle: { backgroundColor: isDark ? '#1C1C1E' : '#F9F9F9' },
                    headerTintColor: isDark ? '#FFFFFF' : '#000000',
                    headerShadowVisible: false,
                }}
            />

            <View className="flex-1 bg-neutral-100 dark:bg-black pt-6 px-4">
                {/* Apple Mail / iOS Settings style list form */}
                <View className="bg-white dark:bg-[#1C1C1E] rounded-xl overflow-hidden mb-6">
                    <View className="border-b border-neutral-200 dark:border-neutral-800 p-4 flex-row items-center">
                        <Text className="text-neutral-500 dark:text-neutral-400 w-24">サービス名:</Text>
                        <TextInput
                            placeholder="Netflix"
                            placeholderTextColor="#9CA3AF"
                            className="flex-1 text-base text-neutral-900 dark:text-white"
                        />
                    </View>
                    <View className="border-b border-neutral-200 dark:border-neutral-800 p-4 flex-row items-center">
                        <Text className="text-neutral-500 dark:text-neutral-400 w-24">プラン名:</Text>
                        <TextInput
                            placeholder="Premium"
                            placeholderTextColor="#9CA3AF"
                            className="flex-1 text-base text-neutral-900 dark:text-white"
                        />
                    </View>
                    <View className="p-4 flex-row items-center">
                        <Text className="text-neutral-500 dark:text-neutral-400 w-24">料金 (¥):</Text>
                        <TextInput
                            placeholder="1980"
                            keyboardType="numeric"
                            placeholderTextColor="#9CA3AF"
                            className="flex-1 text-base text-neutral-900 dark:text-white"
                        />
                    </View>
                </View>

                <TextInput
                    placeholder="メモ..."
                    placeholderTextColor="#9CA3AF"
                    multiline
                    className="flex-1 text-base text-neutral-900 dark:text-white px-2 mt-4"
                    textAlignVertical="top"
                />
            </View>
        </>
    );
}
