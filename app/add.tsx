import React from 'react';
import { View, Text, TextInput, Pressable, useColorScheme, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function AddSubscriptionModal() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
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
                    headerStyle: { backgroundColor: isDark ? '#1C1C1E' : '#F2F2F7' },
                    headerTintColor: isDark ? '#FFFFFF' : '#000000',
                    headerShadowVisible: false,
                }}
            />

            <ScrollView
                className="flex-1 bg-[#F2F2F7] dark:bg-black"
                contentContainerStyle={{ paddingTop: 24, paddingBottom: 40 }}
                keyboardDismissMode="on-drag"
                keyboardShouldPersistTaps="handled"
            >
                <View className="px-4">
                    {/* Main Form Group */}
                    <View className="bg-white dark:bg-[#1C1C1E] rounded-xl overflow-hidden mb-6">
                        <View className="border-b border-neutral-200 dark:border-neutral-800 p-4 pl-4 flex-row items-center">
                            <Text className="text-neutral-900 dark:text-white w-24 text-base">サービス名:</Text>
                            <TextInput
                                placeholder="例: Netflix"
                                placeholderTextColor={isDark ? "#52525B" : "#A1A1AA"}
                                className="flex-1 text-base text-neutral-900 dark:text-white"
                                autoFocus
                            />
                        </View>
                        <View className="border-b border-neutral-200 dark:border-neutral-800 p-4 pl-4 flex-row items-center">
                            <Text className="text-neutral-900 dark:text-white w-24 text-base">プラン名:</Text>
                            <TextInput
                                placeholder="例: Premium"
                                placeholderTextColor={isDark ? "#52525B" : "#A1A1AA"}
                                className="flex-1 text-base text-neutral-900 dark:text-white"
                            />
                        </View>
                        <View className="p-4 pl-4 flex-row items-center">
                            <Text className="text-neutral-900 dark:text-white w-24 text-base">料金:</Text>
                            <TextInput
                                placeholder="¥ 0"
                                keyboardType="numeric"
                                placeholderTextColor={isDark ? "#52525B" : "#A1A1AA"}
                                className="flex-1 text-base text-neutral-900 dark:text-white"
                            />
                        </View>
                    </View>

                    {/* Payment Details Group */}
                    <View className="bg-white dark:bg-[#1C1C1E] rounded-xl overflow-hidden mb-6">
                        <Pressable className="border-b border-neutral-200 dark:border-neutral-800 p-4 pl-4 flex-row items-center justify-between">
                            <Text className="text-neutral-900 dark:text-white text-base">次回支払日</Text>
                            <View className="flex-row items-center">
                                <Text className="text-neutral-500 dark:text-neutral-400 text-base mr-2">今日</Text>
                                <Ionicons name="chevron-forward" size={20} color={isDark ? "#52525B" : "#A1A1AA"} />
                            </View>
                        </Pressable>
                        <Pressable className="border-b border-neutral-200 dark:border-neutral-800 p-4 pl-4 flex-row items-center justify-between">
                            <Text className="text-neutral-900 dark:text-white text-base">支払サイクル</Text>
                            <View className="flex-row items-center">
                                <Text className="text-neutral-500 dark:text-neutral-400 text-base mr-2">月額 (Monthly)</Text>
                                <Ionicons name="chevron-forward" size={20} color={isDark ? "#52525B" : "#A1A1AA"} />
                            </View>
                        </Pressable>
                        <Pressable className="p-4 pl-4 flex-row items-center justify-between">
                            <Text className="text-neutral-900 dark:text-white text-base">支払方法</Text>
                            <View className="flex-row items-center">
                                <Text className="text-neutral-500 dark:text-neutral-400 text-base mr-2">クレジットカード</Text>
                                <Ionicons name="chevron-forward" size={20} color={isDark ? "#52525B" : "#A1A1AA"} />
                            </View>
                        </Pressable>
                    </View>

                    {/* Memo / Notes Group */}
                    <View className="bg-white dark:bg-[#1C1C1E] rounded-xl overflow-hidden mb-6">
                        <TextInput
                            placeholder="メモ..."
                            placeholderTextColor={isDark ? "#52525B" : "#A1A1AA"}
                            multiline
                            className="text-base text-neutral-900 dark:text-white p-4 min-h-[120px]"
                            textAlignVertical="top"
                        />
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
