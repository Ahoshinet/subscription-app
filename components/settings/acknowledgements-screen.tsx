import React from 'react';
import { View, Text, ScrollView, Linking, Pressable } from 'react-native';
import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { SETTINGS_DARK_BACKGROUND } from '@/constants/settings-theme';
import { THIRD_PARTY_LICENSES, THIRD_PARTY_LICENSES_URL } from '@/constants/licenses';

function SectionTitle({ title }: { title: string }) {
    return (
        <Text className="text-sm font-bold text-neutral-500 dark:text-neutral-400 ml-1 mb-3 mt-6">
            {title}
        </Text>
    );
}

function LibraryRow({
    name,
    version,
    license,
    repository,
    isLast = false,
}: {
    name: string;
    version: string;
    license: string;
    repository: string | null;
    isLast?: boolean;
}) {
    return (
        <Pressable
            disabled={!repository}
            onPress={() => repository && Linking.openURL(repository)}
            className={`flex-row items-center justify-between px-4 py-3 ${!isLast ? 'border-b border-neutral-100 dark:border-white/5' : ''}`}
        >
            <View className="flex-1 mr-3">
                <Text className="text-base font-medium text-neutral-900 dark:text-white" numberOfLines={1}>
                    {name}
                </Text>
                <Text className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                    {`v${version} · ${license}`}
                </Text>
            </View>
            {repository ? <Ionicons name="open-outline" size={18} color="#9CA3AF" /> : null}
        </Pressable>
    );
}

export default function AcknowledgementsScreen() {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const { t } = useTranslation();

    return (
        <>
            <Stack.Screen
                options={{
                    title: t('acknowledgements.title'),
                    headerBackTitle: ' ',
                    headerStyle: { backgroundColor: isDark ? SETTINGS_DARK_BACKGROUND : '#ffffff' },
                    headerTintColor: isDark ? '#ffffff' : '#000000',
                    headerShadowVisible: false,
                }}
            />
            <View
                className="flex-1 bg-neutral-50 dark:bg-neutral-950"
                style={{ flex: 1, backgroundColor: isDark ? SETTINGS_DARK_BACKGROUND : '#FAFAFA' }}
            >
                <ScrollView
                    contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 28, paddingBottom: 48 }}
                    showsVerticalScrollIndicator={false}
                >
                    <View className="rounded-2xl border border-neutral-200/50 dark:border-white/10 bg-white dark:bg-[#1C1C1E] px-5 py-5">
                        <Text className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
                            {t('acknowledgements.intro_body')}
                        </Text>
                    </View>

                    <SectionTitle title={t('acknowledgements.section_libraries')} />
                    <Text className="text-xs text-neutral-400 dark:text-neutral-500 ml-1 mb-3">
                        {t('acknowledgements.libraries_note')}
                    </Text>
                    <View className="rounded-2xl overflow-hidden shadow-sm shadow-neutral-200/50 dark:shadow-none border border-neutral-200/50 dark:border-white/10 bg-white dark:bg-[#1C1C1E]">
                        {THIRD_PARTY_LICENSES.map((lib, index) => (
                            <LibraryRow
                                key={`${lib.name}@${lib.version}`}
                                name={lib.name}
                                version={lib.version}
                                license={lib.license}
                                repository={lib.repository}
                                isLast={index === THIRD_PARTY_LICENSES.length - 1}
                            />
                        ))}
                    </View>

                    <View className="rounded-2xl overflow-hidden shadow-sm shadow-neutral-200/50 dark:shadow-none border border-neutral-200/50 dark:border-white/10 bg-white dark:bg-[#1C1C1E] mt-6">
                        <Pressable
                            onPress={() => Linking.openURL(THIRD_PARTY_LICENSES_URL)}
                            className="flex-row items-center justify-between px-4 py-4"
                        >
                            <View className="flex-row items-center flex-1">
                                <View className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-white/10 items-center justify-center mr-3">
                                    <Ionicons name="document-text-outline" size={18} color="#808080" />
                                </View>
                                <Text className="text-base font-medium text-neutral-900 dark:text-white">
                                    {t('acknowledgements.full_licenses')}
                                </Text>
                            </View>
                            <Ionicons name="open-outline" size={18} color="#9CA3AF" />
                        </Pressable>
                    </View>
                    <Text className="text-xs text-neutral-400 dark:text-neutral-500 ml-1 mt-2">
                        {t('acknowledgements.full_licenses_note')}
                    </Text>
                </ScrollView>
            </View>
        </>
    );
}
