import React from 'react';
import { View, Text, useColorScheme, ScrollView, Pressable, Linking, Alert } from 'react-native';
import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

export default function SupportScreen() {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const { t } = useTranslation();

    const showComingSoon = () => {
        Alert.alert(t('support.coming_soon_title'), t('support.coming_soon_message'));
    };

    const openUrl = (url: string) => {
        Linking.openURL(url).catch(err => console.error("Couldn't load page", err));
    };

    return (
        <>
            <Stack.Screen
                options={{
                    title: t('support.title'),
                    headerBackTitle: ' ',
                    headerStyle: { backgroundColor: isDark ? '#000000' : '#ffffff' },
                    headerTintColor: isDark ? '#ffffff' : '#000000',
                }}
            />
            <View className="flex-1 bg-neutral-50 dark:bg-black pt-6">
                <ScrollView className="flex-1 px-4">
                    <View className="bg-white dark:bg-[#1C1C1E] rounded-2xl overflow-hidden shadow-sm shadow-neutral-200/50 dark:shadow-none border border-neutral-200/50 dark:border-white/10 mb-6">

                        <Pressable
                            onPress={showComingSoon}
                            className="flex-row items-center justify-between p-4 border-b border-neutral-100 dark:border-white/5"
                        >
                            <View className="flex-row items-center">
                                <View className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-white/10 items-center justify-center mr-3">
                                    <Ionicons name="help-circle-outline" size={18} color="#808080" />
                                </View>
                                <Text className="text-base font-medium text-neutral-900 dark:text-white">
                                    {t('support.faq')}
                                </Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                        </Pressable>

                        <Pressable
                            onPress={showComingSoon}
                            className="flex-row items-center justify-between p-4 border-b border-neutral-100 dark:border-white/5"
                        >
                            <View className="flex-row items-center">
                                <View className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-white/10 items-center justify-center mr-3">
                                    <Ionicons name="mail-outline" size={18} color="#808080" />
                                </View>
                                <Text className="text-base font-medium text-neutral-900 dark:text-white">
                                    {t('support.contact')}
                                </Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                        </Pressable>

                        <Pressable
                            onPress={() => openUrl('https://github.com/Ahoshinet/subscription-app/issues/new?template=bug_report.md')}
                            className="flex-row items-center justify-between p-4"
                        >
                            <View className="flex-row items-center">
                                <View className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 items-center justify-center mr-3">
                                    <Ionicons name="bug-outline" size={18} color="#ef4444" />
                                </View>
                                <Text className="text-base font-medium text-neutral-900 dark:text-white">
                                    {t('support.report_bug')}
                                </Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                        </Pressable>

                    </View>
                </ScrollView>
            </View>
        </>
    );
}
