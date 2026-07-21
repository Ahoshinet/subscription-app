import React, { useEffect } from 'react';
import { View, Text, Switch, Pressable, ScrollView, Alert } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/useAuthStore';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '@/store/useSettingsStore';
import { usePaidyStore } from '@/store/usePaidyStore';

// Component for a section header
const SectionHeader = ({ title }: { title: string }) => (
  <Text className="text-base font-bold text-neutral-500 dark:text-neutral-400 ml-4 mb-2 mt-6">
    {title}
  </Text>
);

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
}: any) => {
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
  const { theme, setTheme, pushNotifications, setPushNotifications, language, timeZone, syncError, clearSyncError } = useSettingsStore();
  const { isSignedIn: gmailSignedIn, googleEmail } = usePaidyStore();

  useEffect(() => {
    if (syncError) {
      Alert.alert(t('common.error'), t('settings.sync_error'));
      clearSyncError();
    }
  }, [syncError]);

  // If theme is system, fallback to colorScheme, else use theme preference
  const isDark = colorScheme === 'dark';

  const languageLabel = language === 'en' ? 'English' : '日本語';

  return (
    <View className="flex-1 bg-neutral-50 dark:bg-black pt-16">
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
            value={timeZone}
            onPress={() => router.push('/settings/time-zone' as any)}
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
            value={gmailSignedIn ? googleEmail ?? t('gmail.not_connected') : t('gmail.not_connected')}
            onPress={() => router.push('/settings/gmail' as any)}
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
          onPress={async () => {
            await logout();
            router.replace('/login');
          }}
          className="mt-4 mb-8 items-center py-4 rounded-xl bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-900/50"
        >
          <Text className="text-red-600 dark:text-red-400 font-bold text-base">
            {t('settings.log_out')}
          </Text>
        </Pressable>

      </ScrollView>
    </View>
  );
}
