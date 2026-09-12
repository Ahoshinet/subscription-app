import Constants from 'expo-constants';
import { Stack } from 'expo-router';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import React, { useEffect, useState } from 'react';
import { Dimensions, Image, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { SETTINGS_DARK_BACKGROUND } from '@/constants/settings-theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { isUsingPublicApi, versionApi } from '@/lib/api';
import { getCurrentAppVersion } from '@/lib/versionCheck';
import { useSettingsStore } from '@/store/useSettingsStore';

const APP_ICON = require('../../assets/images/icon.png');

interface InfoRowProps {
  icon: SymbolViewProps['name'];
  isLast?: boolean;
  label: string;
  separatorColor: string;
  separatorTestID?: string;
  value: string;
}

function InfoRow({
  icon,
  isLast = false,
  label,
  separatorColor,
  separatorTestID,
  value,
}: InfoRowProps) {
  return (
    <View className="flex-row items-center justify-between px-4 py-4">
      <View className="flex-row items-center flex-1 mr-4">
        <View className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-white/10 items-center justify-center mr-3">
          <SymbolView
            name={icon}
            resizeMode="scaleAspectFit"
            style={styles.rowIcon}
            tintColor="#808080"
          />
        </View>
        <Text className="text-base font-medium text-neutral-900 dark:text-white">
          {label}
        </Text>
      </View>
      <Text className="text-sm text-right text-neutral-500 dark:text-neutral-400 max-w-[48%]">
        {value}
      </Text>
      {!isLast ? (
        <View
          pointerEvents="none"
          style={[styles.separator, { backgroundColor: separatorColor }]}
          testID={separatorTestID}
        />
      ) : null}
    </View>
  );
}

interface LinkRowProps {
  icon: SymbolViewProps['name'];
  isLast?: boolean;
  label: string;
  separatorColor: string;
  url: string;
}

function LinkRow({ icon, isLast = false, label, separatorColor, url }: LinkRowProps) {
  return (
    <Pressable
      className="flex-row items-center justify-between px-4 py-4"
      onPress={() => Linking.openURL(url)}
    >
      <View className="flex-row items-center flex-1">
        <View className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-white/10 items-center justify-center mr-3">
          <SymbolView
            name={icon}
            resizeMode="scaleAspectFit"
            style={styles.rowIcon}
            tintColor="#808080"
          />
        </View>
        <Text className="text-base font-medium text-neutral-900 dark:text-white">
          {label}
        </Text>
      </View>
      <SymbolView
        name="arrow.up.right.square"
        resizeMode="scaleAspectFit"
        style={styles.trailingIcon}
        tintColor="#9CA3AF"
        weight="semibold"
      />
      {!isLast ? (
        <View
          pointerEvents="none"
          style={[styles.separator, { backgroundColor: separatorColor }]}
        />
      ) : null}
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

  const version = getCurrentAppVersion();
  const rawScheme = Constants.expoConfig?.scheme;
  const scheme = Array.isArray(rawScheme)
    ? rawScheme.join(', ')
    : rawScheme ?? t('about.unavailable');
  const orientation = Constants.expoConfig?.orientation ?? t('about.unavailable');
  const baseLabel = isUsingPublicApi()
    ? t('about.api_server_public')
    : t('about.api_server_local');
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
  const backgroundColor = isDark ? SETTINGS_DARK_BACKGROUND : '#FAFAFA';
  const separatorColor = isDark
    ? 'rgba(84, 84, 88, 0.65)'
    : 'rgba(60, 60, 67, 0.29)';

  return (
    <>
      <Stack.Screen
        options={{
          title: t('settings.version'),
          headerBackTitle: ' ',
          headerShadowVisible: false,
          headerStyle: { backgroundColor },
          headerTintColor: textPrimary,
        }}
      />
      <ScrollView
        className="flex-1"
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        style={{ backgroundColor }}
      >
        <View
          className="rounded-[28px] bg-white dark:bg-[#1C1C1E]"
          style={styles.heroCard}
          testID="ios-about-hero-card"
        >
          <Image source={APP_ICON} style={styles.appIcon} />
          <Text style={[styles.heroTitle, { color: textPrimary }]}>Subscription Manager</Text>
          <Text style={[styles.heroSubtitle, { color: textSub }]}>
            {t('about.hero_subtitle')}
          </Text>
        </View>

        <View
          className="rounded-2xl overflow-hidden bg-white dark:bg-[#1C1C1E]"
          style={styles.group}
          testID="ios-about-app-card"
        >
          <InfoRow icon="sparkles" label={t('about.app_name')} value="Subscription Manager" separatorColor={separatorColor} separatorTestID="ios-about-separator-app-name" />
          <InfoRow icon="tag" label={t('about.version')} value={`v${version}`} separatorColor={separatorColor} />
          <InfoRow icon="link" label={t('about.scheme')} value={scheme} separatorColor={separatorColor} />
          <InfoRow icon="iphone" label={t('about.orientation')} value={orientation} separatorColor={separatorColor} />
          <InfoRow icon="cloud" isLast label={t('about.api_server')} value={apiServerLabel} separatorColor={separatorColor} />
        </View>

        <View
          className="rounded-2xl overflow-hidden bg-white dark:bg-[#1C1C1E]"
          style={styles.group}
          testID="ios-about-environment-card"
        >
          <InfoRow icon="cpu" label={t('about.platform')} value={platformLabel} separatorColor={separatorColor} />
          <InfoRow icon="iphone" label={t('about.os_version')} value={osVersion} separatorColor={separatorColor} />
          <InfoRow icon="rectangle.dashed" label={t('about.screen_size')} value={`${Math.round(width)} x ${Math.round(height)}`} separatorColor={separatorColor} />
          <InfoRow icon="character" label={t('about.language')} value={languageLabel} separatorColor={separatorColor} />
          <InfoRow icon="moon" isLast label={t('about.theme')} value={themeLabel} separatorColor={separatorColor} />
        </View>

        <View
          className="rounded-2xl overflow-hidden bg-white dark:bg-[#1C1C1E]"
          style={styles.group}
          testID="ios-about-creator-card"
        >
          <View style={styles.creatorRow}>
            <Pressable
              style={styles.creator}
              onPress={() => Linking.openURL('https://github.com/darui3018823')}
            >
              <Image source={{ uri: 'https://github.com/darui3018823.png' }} style={styles.personalAvatar} />
              <Text style={[styles.creatorName, { color: textPrimary }]}>darui3018823</Text>
              <Text style={[styles.creatorRole, { color: textSub }]}>{t('about.role_developer')}</Text>
            </Pressable>

            <View style={[styles.creatorDivider, { backgroundColor: separatorColor }]} />

            <Pressable
              style={styles.creator}
              onPress={() => Linking.openURL('https://github.com/Ahoshinet')}
            >
              <Image source={{ uri: 'https://github.com/Ahoshinet.png' }} style={styles.orgAvatar} />
              <Text style={[styles.creatorName, { color: textPrimary }]}>Ahoshinet</Text>
              <Text style={[styles.creatorRole, { color: textSub }]}>{t('about.role_org')}</Text>
            </Pressable>
          </View>
        </View>

        <View
          className="rounded-2xl overflow-hidden bg-white dark:bg-[#1C1C1E] mb-2"
          style={styles.creditsCard}
          testID="ios-about-credits-card"
        >
          <InfoRow icon="person.2" label={t('about.developer')} value="darui3018823 / Ahoshinet" separatorColor={separatorColor} />
          <InfoRow icon="doc.text" label={t('about.license')} value="BSD 2-Clause" separatorColor={separatorColor} />
          <LinkRow icon="chevron.left.forwardslash.chevron.right" label="GitHub Repository" url="https://github.com/Ahoshinet/subscription-app" separatorColor={separatorColor} />
          <LinkRow icon="ladybug" isLast label={t('about.report_issue')} url="https://github.com/Ahoshinet/subscription-app/issues" separatorColor={separatorColor} />
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  appIcon: {
    borderRadius: 22,
    height: 82,
    marginBottom: 16,
    width: 82,
  },
  creator: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 20,
  },
  creatorDivider: {
    marginVertical: 16,
    width: StyleSheet.hairlineWidth,
  },
  creatorName: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  creatorRole: {
    fontSize: 11,
  },
  creatorRow: {
    flexDirection: 'row',
  },
  creditsCard: {
    marginTop: 12,
  },
  group: {
    marginTop: 32,
  },
  heroCard: {
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    paddingVertical: 28,
  },
  heroSubtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 6,
  },
  orgAvatar: {
    borderRadius: 16,
    height: 56,
    marginBottom: 10,
    width: 56,
  },
  personalAvatar: {
    borderRadius: 28,
    height: 56,
    marginBottom: 10,
    width: 56,
  },
  rowIcon: {
    height: 18,
    width: 18,
  },
  scrollContent: {
    paddingBottom: 48,
    paddingHorizontal: 16,
    paddingTop: 28,
  },
  separator: {
    bottom: 0,
    height: StyleSheet.hairlineWidth,
    left: 60,
    position: 'absolute',
    right: 16,
  },
  trailingIcon: {
    height: 18,
    width: 18,
  },
});
