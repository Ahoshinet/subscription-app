import React, { useEffect, useState } from 'react';
import { View, Text, Switch, Pressable, ScrollView, Alert, Platform, Modal } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/useAuthStore';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '@/store/useSettingsStore';
import { usePaidyStore } from '@/store/usePaidyStore';
import { isTimeZoneSupported } from '@/lib/timeZone';
import { getErrorMessage } from '@/lib/errors';

// Component for a section header
const SectionHeader = ({ title }: { title: string }) => (
  <Text className="text-base font-bold text-neutral-500 dark:text-neutral-400 ml-4 mb-2 mt-6">
    {title}
  </Text>
);

interface SettingsRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  value?: string;
  type?: 'link' | 'toggle';
  isFirst?: boolean;
  isLast?: boolean;
  onPress?: () => void;
  toggleValue?: boolean;
  onToggle?: (value: boolean) => void;
}

// Component for a single settings row
const SettingsRow = ({
  icon,
  title,
  value,
  type = 'link',
  isFirst = false,
  isLast = false,
  onPress,
  toggleValue = false,
  onToggle
}: SettingsRowProps) => {
  return (
    <Pressable
      onPress={type === 'link' ? onPress : undefined}
      style={{ minHeight: 56 }}
      className={`
        bg-white dark:bg-[#1C1C1E] flex-row items-center justify-between px-4
        ${!isLast ? 'border-b border-neutral-100 dark:border-white/5' : ''}
        ${isFirst ? 'rounded-t-2xl' : ''}
        ${isLast ? 'rounded-b-2xl' : ''}
      `}
    >
      <View className="flex-row items-center flex-1">
        <View className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-white/10 items-center justify-center mr-3">
          <Ionicons name={icon} size={18} color="#808080" />
        </View>
        <Text className="text-base font-medium text-neutral-900 dark:text-white">
          {title}
        </Text>
      </View>

      <View className="flex-row items-center shrink-0">
        {value && (
          <Text className="text-base text-neutral-500 dark:text-neutral-400 mr-2" numberOfLines={1}>
            {value}
          </Text>
        )}

        {type === 'link' && (
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        )}

        {type === 'toggle' && (
          <Switch
            value={toggleValue}
            onValueChange={onToggle}
            trackColor={{ false: '#3f3f46', true: '#3B82F6' }}
            thumbColor={'#ffffff'}
            style={{ transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }] }}
          />
        )}
      </View>
    </Pressable>
  );
};

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const { logout, user } = useAuthStore();
  const { t } = useTranslation();
  const { setTheme, pushNotifications, setPushNotifications, language, timeZone, syncError, clearSyncError } = useSettingsStore();
  const { isSignedIn: gmailSignedIn } = usePaidyStore();
  const [logoutConfirmationVisible, setLogoutConfirmationVisible] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    if (syncError) {
      Alert.alert(t('common.error'), t('settings.sync_error'));
      clearSyncError();
    }
  }, [clearSyncError, syncError, t]);

  // If theme is system, fallback to colorScheme, else use theme preference
  const isDark = colorScheme === 'dark';

  const languageLabel = language === 'en' ? 'English' : '日本語';

  const performLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    setLogoutConfirmationVisible(false);
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
    if (Platform.OS === 'ios') {
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
      return;
    }

    setLogoutConfirmationVisible(true);
  };

  return (
    <View className="flex-1 bg-neutral-50 dark:bg-neutral-950 pt-16">
      {/* Header */}
      <View className="px-6 mb-4">
        <Text className="text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
          {t('settings.title')}
        </Text>
      </View>

      <ScrollView
        className="flex-1 px-4"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }} // padding for bottom tab bar
      >

        {/* Account Section */}
        <SectionHeader title={t('settings.account')} />
        <View className="rounded-2xl overflow-hidden shadow-sm shadow-neutral-200/50 dark:shadow-none border border-neutral-200/50 dark:border-white/10">
          <SettingsRow
            isFirst
            icon="person-outline"
            title={t('settings.profile')}
            value={user?.username ?? ''}
            onPress={() => router.push('/settings/profile')}
          />
          <SettingsRow
            icon="card-outline"
            title={t('settings.billing_methods')}
            onPress={() => router.push('/settings/billing')}
          />
          <SettingsRow
            isLast
            icon="lock-closed-outline"
            title={t('settings.change_password')}
            onPress={() => router.push('/settings/password')}
          />
        </View>

        {/* Preferences Section */}
        <SectionHeader title={t('settings.preferences')} />
        <View className="rounded-2xl overflow-hidden shadow-sm shadow-neutral-200/50 dark:shadow-none border border-neutral-200/50 dark:border-white/10">
          <SettingsRow
            isFirst
            type="toggle"
            icon="moon-outline"
            title={t('settings.dark_mode')}
            toggleValue={isDark}
            onToggle={() => setTheme(isDark ? 'light' : 'dark')}
          />
          <SettingsRow
            icon="language-outline"
            title={t('settings.language')}
            value={languageLabel}
            onPress={() => router.push('/settings/language')}
          />
          <SettingsRow
            icon="globe-outline"
            title={t('settings.time_zone')}
            value={isTimeZoneSupported(timeZone) ? timeZone : `${timeZone} · ${t('time_zone.unsupported_short')}`}
            onPress={() => router.push('/settings/time-zone')}
          />
          <SettingsRow
            isLast
            type="toggle"
            icon="notifications-outline"
            title={t('settings.push_notifications')}
            toggleValue={pushNotifications}
            onToggle={(val: boolean) => setPushNotifications(val)}
          />
        </View>

        {/* Integrations Section */}
        <SectionHeader title={t('gmail.section_title')} />
        <View className="rounded-2xl overflow-hidden shadow-sm shadow-neutral-200/50 dark:shadow-none border border-neutral-200/50 dark:border-white/10">
          <SettingsRow
            isFirst
            isLast
            icon="mail-outline"
            title={`${t('gmail.row_title')} β`}
            value={gmailSignedIn ? t('gmail.connected') : t('gmail.not_connected')}
            onPress={() => router.push('/settings/gmail')}
          />
        </View>

        {/* App Section */}
        <SectionHeader title={t('settings.app_info')} />
        <View className="rounded-2xl overflow-hidden shadow-sm shadow-neutral-200/50 dark:shadow-none border border-neutral-200/50 dark:border-white/10 mb-6">
          <SettingsRow
            isFirst
            icon="help-circle-outline"
            title={t('settings.help_support')}
            onPress={() => router.push('/settings/support')}
          />
          <SettingsRow
            icon="document-text-outline"
            title={t('settings.terms_of_service')}
            onPress={() => router.push('/settings/tos')}
          />
          <SettingsRow
            icon="shield-checkmark-outline"
            title={t('settings.privacy_policy')}
            onPress={() => router.push('/settings/privacy')}
          />
          <SettingsRow
            isLast
            icon="information-circle-outline"
            title={t('settings.version')}
            onPress={() => router.push('/settings/about')}
          />
        </View>

        {/* Logout Button */}
        <Pressable
          onPress={confirmLogout}
          disabled={isLoggingOut}
          style={{ opacity: isLoggingOut ? 0.6 : 1 }}
          className="mt-4 mb-8 items-center py-4 rounded-xl bg-white dark:bg-[#1C1C1E] border border-neutral-200/50 dark:border-white/10"
        >
          <Text className="text-red-600 dark:text-red-400 font-bold text-base">
            {t('settings.log_out')}
          </Text>
        </Pressable>

      </ScrollView>

      <Modal
        visible={logoutConfirmationVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setLogoutConfirmationVisible(false)}
      >
        <View
          className="flex-1 items-center justify-center px-6"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.45)' }}
        >
          <Pressable
            className="absolute inset-0"
            onPress={() => setLogoutConfirmationVisible(false)}
            accessible={false}
          />
          <View
            accessibilityRole="alert"
            accessibilityViewIsModal
            style={{
              width: '100%',
              maxWidth: 400,
              borderRadius: 28,
              paddingHorizontal: 24,
              paddingTop: 24,
              paddingBottom: 12,
              backgroundColor: isDark ? '#1C1C1C' : '#F7F2FA',
            }}
          >
            <Text
              style={{
                color: isDark ? '#F5F5F5' : '#1D1B20',
                fontSize: 24,
                lineHeight: 32,
                fontWeight: '600',
              }}
            >
              {t('settings.log_out_confirm_title')}
            </Text>
            <Text
              style={{
                color: isDark ? '#CAC4D0' : '#49454F',
                fontSize: 14,
                lineHeight: 20,
                marginTop: 12,
              }}
            >
              {t('settings.log_out_confirm_message')}
            </Text>
            <View className="flex-row justify-end mt-5">
              <Pressable
                accessibilityRole="button"
                onPress={() => setLogoutConfirmationVisible(false)}
                className="min-h-12 justify-center px-3"
              >
                <Text className="text-blue-500 font-semibold text-sm">
                  {t('common.cancel')}
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => void performLogout()}
                className="min-h-12 justify-center px-3 ml-1"
              >
                <Text className="text-red-600 dark:text-red-400 font-semibold text-sm">
                  {t('settings.log_out')}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
