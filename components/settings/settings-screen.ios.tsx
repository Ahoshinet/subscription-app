import { Ionicons } from '@expo/vector-icons';
import { useRouter, useScrollToTop } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { getErrorMessage } from '@/lib/errors';
import { isTimeZoneSupported } from '@/lib/timeZone';
import { useAuthStore } from '@/store/useAuthStore';
import { usePaidyStore } from '@/store/usePaidyStore';
import { useSettingsStore } from '@/store/useSettingsStore';

const IOS_COLORS = {
  light: {
    background: '#F2F2F7',
    card: '#FFFFFF',
    separator: '#C6C6C8',
    primary: '#000000',
    secondary: '#8E8E93',
    iconBackground: '#E5E5EA',
    icon: '#636366',
    chevron: '#8E8E93',
    accent: '#007AFF',
    switchOff: '#E9E9EA',
    destructive: '#FF3B30',
  },
  dark: {
    background: '#000000',
    card: '#1C1C1E',
    separator: '#38383A',
    primary: '#FFFFFF',
    secondary: '#8E8E93',
    iconBackground: '#2C2C2E',
    icon: '#98989D',
    chevron: '#8E8E93',
    accent: '#0A84FF',
    switchOff: '#39393D',
    destructive: '#FF453A',
  },
} as const;

type IOSSettingsColors = (typeof IOS_COLORS)[keyof typeof IOS_COLORS];

interface SectionHeaderProps {
  title: string;
  color: string;
}

function SectionHeader({ title, color }: SectionHeaderProps) {
  return <Text style={[styles.sectionHeader, { color }]}>{title}</Text>;
}

interface SettingsRowProps {
  colors: IOSSettingsColors;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  value?: string;
  type?: 'link' | 'toggle';
  isLast?: boolean;
  onPress?: () => void;
  toggleValue?: boolean;
  onToggle?: (value: boolean) => void;
}

function SettingsRow({
  colors,
  icon,
  title,
  value,
  type = 'link',
  isLast = false,
  onPress,
  toggleValue = false,
  onToggle,
}: SettingsRowProps) {
  return (
    <Pressable
      accessibilityLabel={type === 'link' ? title : undefined}
      accessibilityRole={type === 'link' ? 'button' : undefined}
      accessible={type === 'link'}
      disabled={type !== 'link'}
      onPress={type === 'link' ? onPress : undefined}
      style={[styles.row, { backgroundColor: colors.card }]}
    >
      <View style={styles.rowLeading}>
        <View
          style={[styles.iconContainer, { backgroundColor: colors.iconBackground }]}
        >
          <Ionicons name={icon} size={21} color={colors.icon} />
        </View>
        <Text
          numberOfLines={1}
          style={[styles.rowTitle, { color: colors.primary }]}
        >
          {title}
        </Text>
      </View>

      <View style={styles.rowTrailing}>
        {value ? (
          <Text
            numberOfLines={1}
            style={[styles.rowValue, { color: colors.secondary }]}
          >
            {value}
          </Text>
        ) : null}

        {type === 'link' ? (
          <Ionicons name="chevron-forward" size={22} color={colors.chevron} />
        ) : (
          <Switch
            accessibilityLabel={title}
            ios_backgroundColor={colors.switchOff}
            onValueChange={onToggle}
            trackColor={{ false: colors.switchOff, true: colors.accent }}
            value={toggleValue}
          />
        )}
      </View>

      {!isLast ? (
        <View
          pointerEvents="none"
          style={[styles.separator, { backgroundColor: colors.separator }]}
        />
      ) : null}
    </Pressable>
  );
}

interface SettingsCardProps {
  children: React.ReactNode;
  colors: IOSSettingsColors;
  bottomSpacing?: boolean;
}

function SettingsCard({ children, colors, bottomSpacing = false }: SettingsCardProps) {
  return (
    <View
      style={[
        styles.card,
        bottomSpacing && styles.cardBottomSpacing,
        { backgroundColor: colors.card },
      ]}
    >
      {children}
    </View>
  );
}

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const colors = IOS_COLORS[colorScheme === 'dark' ? 'dark' : 'light'];
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  useScrollToTop(scrollRef);

  const { logout, user } = useAuthStore();
  const { t } = useTranslation();
  const {
    clearSyncError,
    language,
    pushNotifications,
    setPushNotifications,
    setTheme,
    syncError,
    timeZone,
  } = useSettingsStore();
  const { isSignedIn: gmailSignedIn } = usePaidyStore();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    if (!syncError) return;
    Alert.alert(t('common.error'), t('settings.sync_error'));
    clearSyncError();
  }, [clearSyncError, syncError, t]);

  const languageLabel = language === 'en' ? 'English' : '日本語';

  const performLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await logout();
      router.replace('/login');
    } catch (error: unknown) {
      Alert.alert(
        t('common.error'),
        getErrorMessage(error, t('settings.log_out_failed')),
      );
    } finally {
      setIsLoggingOut(false);
    }
  };

  const confirmLogout = () => {
    Alert.alert(
      t('settings.log_out_confirm_title'),
      t('settings.log_out_confirm_message'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('settings.log_out'),
          style: 'destructive',
          onPress: () => void performLogout(),
        },
      ],
    );
  };

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.safeArea, { backgroundColor: colors.background }]}
      testID="ios-settings-screen"
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.primary }]}>
          {t('settings.title')}
        </Text>
      </View>

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <SectionHeader title={t('settings.account')} color={colors.secondary} />
        <SettingsCard colors={colors}>
          <SettingsRow
            colors={colors}
            icon="person-outline"
            title={t('settings.profile')}
            value={user?.username ?? ''}
            onPress={() => router.push('/settings/profile')}
          />
          <SettingsRow
            colors={colors}
            icon="card-outline"
            title={t('settings.billing_methods')}
            onPress={() => router.push('/settings/billing')}
          />
          <SettingsRow
            colors={colors}
            icon="lock-closed-outline"
            isLast
            title={t('settings.change_password')}
            onPress={() => router.push('/settings/password')}
          />
        </SettingsCard>

        <SectionHeader title={t('settings.preferences')} color={colors.secondary} />
        <SettingsCard colors={colors}>
          <SettingsRow
            colors={colors}
            icon="moon-outline"
            title={t('settings.dark_mode')}
            toggleValue={isDark}
            type="toggle"
            onToggle={() => setTheme(isDark ? 'light' : 'dark')}
          />
          <SettingsRow
            colors={colors}
            icon="language-outline"
            title={t('settings.language')}
            value={languageLabel}
            onPress={() => router.push('/settings/language')}
          />
          <SettingsRow
            colors={colors}
            icon="globe-outline"
            title={t('settings.time_zone')}
            value={
              isTimeZoneSupported(timeZone)
                ? timeZone
                : `${timeZone} · ${t('time_zone.unsupported_short')}`
            }
            onPress={() => router.push('/settings/time-zone')}
          />
          <SettingsRow
            colors={colors}
            icon="notifications-outline"
            isLast
            title={t('settings.push_notifications')}
            toggleValue={pushNotifications}
            type="toggle"
            onToggle={setPushNotifications}
          />
        </SettingsCard>

        <SectionHeader title={t('gmail.section_title')} color={colors.secondary} />
        <SettingsCard colors={colors}>
          <SettingsRow
            colors={colors}
            icon="mail-outline"
            isLast
            title={`${t('gmail.row_title')} β`}
            value={gmailSignedIn ? t('gmail.connected') : t('gmail.not_connected')}
            onPress={() => router.push('/settings/gmail')}
          />
        </SettingsCard>

        <SectionHeader title={t('settings.app_info')} color={colors.secondary} />
        <SettingsCard colors={colors} bottomSpacing>
          <SettingsRow
            colors={colors}
            icon="help-circle-outline"
            title={t('settings.help_support')}
            onPress={() => router.push('/settings/support')}
          />
          <SettingsRow
            colors={colors}
            icon="document-text-outline"
            title={t('settings.terms_of_service')}
            onPress={() => router.push('/settings/tos')}
          />
          <SettingsRow
            colors={colors}
            icon="shield-checkmark-outline"
            title={t('settings.privacy_policy')}
            onPress={() => router.push('/settings/privacy')}
          />
          <SettingsRow
            colors={colors}
            icon="information-circle-outline"
            isLast
            title={t('settings.version')}
            onPress={() => router.push('/settings/about')}
          />
        </SettingsCard>

        <Pressable
          accessibilityRole="button"
          disabled={isLoggingOut}
          onPress={confirmLogout}
          style={[
            styles.logoutButton,
            {
              backgroundColor: colors.card,
              opacity: isLoggingOut ? 0.5 : 1,
            },
          ]}
        >
          <Text style={[styles.logoutText, { color: colors.destructive }]}>
            {t('settings.log_out')}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    paddingBottom: 6,
    paddingHorizontal: 22,
    paddingTop: 18,
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    letterSpacing: 0.25,
    lineHeight: 41,
  },
  scrollContent: {
    paddingBottom: 112,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
    marginBottom: 10,
    marginLeft: 12,
    marginTop: 28,
  },
  card: {
    borderRadius: 18,
    overflow: 'hidden',
  },
  cardBottomSpacing: {
    marginBottom: 8,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 68,
    paddingHorizontal: 16,
  },
  rowLeading: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    minWidth: 0,
  },
  iconContainer: {
    alignItems: 'center',
    borderRadius: 9,
    height: 36,
    justifyContent: 'center',
    marginRight: 13,
    width: 36,
  },
  rowTitle: {
    flexShrink: 1,
    fontSize: 17,
    fontWeight: '500',
    letterSpacing: -0.2,
    lineHeight: 22,
  },
  rowTrailing: {
    alignItems: 'center',
    flexDirection: 'row',
    marginLeft: 10,
    maxWidth: '50%',
  },
  rowValue: {
    flexShrink: 1,
    fontSize: 17,
    lineHeight: 22,
    marginRight: 8,
  },
  separator: {
    bottom: 0,
    height: StyleSheet.hairlineWidth,
    left: 65,
    position: 'absolute',
    right: 0,
  },
  logoutButton: {
    alignItems: 'center',
    borderRadius: 18,
    justifyContent: 'center',
    marginBottom: 24,
    marginTop: 24,
    minHeight: 56,
  },
  logoutText: {
    fontSize: 17,
    fontWeight: '600',
    lineHeight: 22,
  },
});
