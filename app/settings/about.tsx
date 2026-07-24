import React, { useEffect, useState } from 'react';
import { View, Text, Image, ScrollView, Platform, Dimensions, Pressable, Linking } from 'react-native';
import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSettingsStore } from '@/store/useSettingsStore';
import { isUsingPublicApi, versionApi } from '@/lib/api';

const APP_ICON = require('../../assets/images/icon.png');

function SectionTitle({ title }: { title: string }) {
    return (
        <Text className="text-sm font-bold text-neutral-500 dark:text-neutral-400 ml-1 mb-3 mt-6">
            {title}
        </Text>
    );
}

function InfoRow({
    icon,
    label,
    value,
    isLast = false,
}: {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    value: string;
    isLast?: boolean;
}) {
    return (
        <View
            className={`flex-row items-center justify-between px-4 py-4 ${!isLast ? 'border-b border-neutral-100 dark:border-white/5' : ''}`}
        >
            <View className="flex-row items-center flex-1 mr-4">
                <View className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-white/10 items-center justify-center mr-3">
                    <Ionicons name={icon} size={18} color="#808080" />
                </View>
                <Text className="text-base font-medium text-neutral-900 dark:text-white">
                    {label}
                </Text>
            </View>
            <Text className="text-sm text-right text-neutral-500 dark:text-neutral-400 max-w-[48%]">
                {value}
            </Text>
        </View>
    );
}

function LinkRow({
    icon,
    label,
    url,
    isLast = false,
}: {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    url: string;
    isLast?: boolean;
}) {
    return (
        <Pressable
            onPress={() => Linking.openURL(url)}
            className={`flex-row items-center justify-between px-4 py-4 ${!isLast ? 'border-b border-neutral-100 dark:border-white/5' : ''}`}
        >
            <View className="flex-row items-center flex-1">
                <View className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-white/10 items-center justify-center mr-3">
                    <Ionicons name={icon} size={18} color="#808080" />
                </View>
                <Text className="text-base font-medium text-neutral-900 dark:text-white">
                    {label}
                </Text>
            </View>
            <Ionicons name="open-outline" size={18} color="#9CA3AF" />
        </Pressable>
    );
}

export default function AboutScreen() {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const { t } = useTranslation();
    const { language, theme } = useSettingsStore();
    const [serverVersion, setServerVersion] = useState<string | null>(null);

    useEffect(() => {
        versionApi.getServerVersion()
            .then(({ version }) => setServerVersion(version))
            .catch(() => {});
    }, []);

    const version = Constants.expoConfig?.version ?? '1.0.0';
    const rawScheme = Constants.expoConfig?.scheme;
    const scheme = Array.isArray(rawScheme)
        ? rawScheme.join(', ')
        : rawScheme ?? t('about.unavailable');
    const orientation = Constants.expoConfig?.orientation ?? t('about.unavailable');
    const baseLabel = isUsingPublicApi() ? t('about.api_server_public') : t('about.api_server_local');
    const apiServerLabel = serverVersion ? `${baseLabel} (v${serverVersion})` : baseLabel;
    const { width, height } = Dimensions.get('window');
    const platformLabel = Platform.OS === 'ios' ? 'iOS' : 'Android';
    const osVersion = String(Platform.Version);
    const languageLabel = language === 'ja' ? '日本語' : 'English';
    const themeLabel = theme === 'system'
        ? t('about.theme_system')
        : theme === 'dark'
            ? t('about.theme_dark')
            : t('about.theme_light');
    const textPrimary = isDark ? '#FFFFFF' : '#000000';
    const textSub = isDark ? '#8E8E93' : '#6B7280';

    return (
        <>
            <Stack.Screen
                options={{
                    title: t('settings.version'),
                    headerBackTitle: ' ',
                    headerStyle: { backgroundColor: isDark ? '#0A0A0A' : '#ffffff' },
                    headerTintColor: textPrimary,
                    headerShadowVisible: false,
                }}
            />
            <ScrollView
                className="flex-1 bg-neutral-50 dark:bg-neutral-950"
                contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 28, paddingBottom: 48 }}
                showsVerticalScrollIndicator={false}
            >
                <View
                    className="rounded-[28px] border border-neutral-200/60 dark:border-white/10 bg-white dark:bg-[#1C1C1E]"
                    style={{ paddingHorizontal: 24, paddingVertical: 28 }}
                >
                    <View style={{ alignItems: 'center' }}>
                        <Image
                            source={APP_ICON}
                            style={{ width: 82, height: 82, borderRadius: 22, marginBottom: 16 }}
                        />
                        <Text style={{ fontSize: 24, fontWeight: '800', color: textPrimary, marginBottom: 6 }}>
                            Subscription Manager
                        </Text>
                        <Text style={{ fontSize: 14, color: textSub, textAlign: 'center' }}>
                            {t('about.hero_subtitle')}
                        </Text>
                    </View>
                </View>

                <SectionTitle title={t('about.section_app')} />
                <View className="rounded-2xl overflow-hidden shadow-sm shadow-neutral-200/50 dark:shadow-none border border-neutral-200/50 dark:border-white/10 bg-white dark:bg-[#1C1C1E]">
                    <InfoRow icon="sparkles-outline" label={t('about.app_name')} value="Subscription Manager" />
                    <InfoRow icon="pricetag-outline" label={t('about.version')} value={`v${version}`} />
                    <InfoRow icon="link-outline" label={t('about.scheme')} value={scheme} />
                    <InfoRow icon="phone-portrait-outline" label={t('about.orientation')} value={orientation} />
                    <InfoRow icon="cloud-outline" label={t('about.api_server')} value={apiServerLabel} isLast />
                </View>

                <SectionTitle title={t('about.section_device')} />
                <View className="rounded-2xl overflow-hidden shadow-sm shadow-neutral-200/50 dark:shadow-none border border-neutral-200/50 dark:border-white/10 bg-white dark:bg-[#1C1C1E]">
                    <InfoRow icon="hardware-chip-outline" label={t('about.platform')} value={platformLabel} />
                    <InfoRow icon="phone-portrait-outline" label={t('about.os_version')} value={osVersion} />
                    <InfoRow icon="scan-outline" label={t('about.screen_size')} value={`${Math.round(width)} x ${Math.round(height)}`} />
                    <InfoRow icon="language-outline" label={t('about.language')} value={languageLabel} />
                    <InfoRow icon="moon-outline" label={t('about.theme')} value={themeLabel} isLast />
                </View>

                <SectionTitle title={t('about.section_credits')} />

                {/* Creator card */}
                <View className="rounded-2xl overflow-hidden border border-neutral-200/50 dark:border-white/10 bg-white dark:bg-[#1C1C1E] mb-3">
                    <View style={{ flexDirection: 'row' }}>
                        {/* Personal */}
                        <Pressable
                            style={{ flex: 1, alignItems: 'center', paddingVertical: 20, paddingHorizontal: 12 }}
                            onPress={() => Linking.openURL('https://github.com/darui3018823')}
                        >
                            <Image
                                source={{ uri: 'https://github.com/darui3018823.png' }}
                                style={{ width: 56, height: 56, borderRadius: 28, marginBottom: 10 }}
                            />
                            <Text style={{ fontSize: 13, fontWeight: '600', color: textPrimary, marginBottom: 2 }}>
                                darui3018823
                            </Text>
                            <Text style={{ fontSize: 11, color: textSub }}>{t('about.role_developer')}</Text>
                        </Pressable>

                        {/* Divider */}
                        <View style={{ width: 1, backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)', marginVertical: 16 }} />

                        {/* Org */}
                        <Pressable
                            style={{ flex: 1, alignItems: 'center', paddingVertical: 20, paddingHorizontal: 12 }}
                            onPress={() => Linking.openURL('https://github.com/Ahoshinet')}
                        >
                            <Image
                                source={{ uri: 'https://github.com/Ahoshinet.png' }}
                                style={{ width: 56, height: 56, borderRadius: 16, marginBottom: 10 }}
                            />
                            <Text style={{ fontSize: 13, fontWeight: '600', color: textPrimary, marginBottom: 2 }}>
                                Ahoshinet
                            </Text>
                            <Text style={{ fontSize: 11, color: textSub }}>{t('about.role_org')}</Text>
                        </Pressable>
                    </View>
                </View>

                <View className="rounded-2xl overflow-hidden shadow-sm shadow-neutral-200/50 dark:shadow-none border border-neutral-200/50 dark:border-white/10 bg-white dark:bg-[#1C1C1E]">
                    <InfoRow icon="person-outline" label={t('about.developer')} value="darui3018823 / Ahoshinet" />
                    <InfoRow icon="document-text-outline" label={t('about.license')} value="BSD 2-Clause" />
                    <LinkRow
                        icon="logo-github"
                        label="GitHub Repository"
                        url="https://github.com/Ahoshinet/subscription-app"
                    />
                    <LinkRow
                        icon="bug-outline"
                        label={t('about.report_issue')}
                        url="https://github.com/Ahoshinet/subscription-app/issues"
                        isLast
                    />
                </View>
            </ScrollView>
        </>
    );
}
