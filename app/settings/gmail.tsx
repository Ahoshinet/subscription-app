import * as Google from 'expo-auth-session/providers/google';
import { Platform, View, Text, Pressable, ActivityIndicator, Alert, ScrollView, Linking } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';
import { usePaidyStore } from '@/store/usePaidyStore';
import { fetchGoogleUserEmail } from '@/lib/gmail';
import { GOOGLE_IOS_CLIENT_ID, GOOGLE_ANDROID_CLIENT_ID, GOOGLE_WEB_CLIENT_ID, GOOGLE_DEV_REDIRECT_URI, GOOGLE_IOS_REDIRECT_URI } from '@/constants/googleConfig';

const DOCS_URL = 'https://github.com/Ahoshinet/subscription-app/blob/main/docs/gmail-integration.md';

export default function GmailSettingsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { t } = useTranslation();
  const connectedStatusColor = isDark ? '#73967b' : '#5f8067';
  const connectedStatusBackgroundColor = isDark ? '#1b2520' : '#eef3ef';
  const reauthAccentColor = isDark ? '#b89b67' : '#8f703d';
  const reauthTextColor = isDark ? '#c4ae85' : '#765c32';
  const reauthSurfaceColor = isDark ? '#1c1915' : '#faf8f3';
  const reauthBorderColor = isDark ? '#453b2d' : '#e3dac9';

  const {
    isSignedIn,
    needsReauth,
    googleEmail,
    paidyAmount,
    paidyMonth,
    lastSyncedAt,
    isLoading,
    error,
    setSignedIn,
    syncPaidy,
    signOut,
    clearError,
  } = usePaidyStore();

  const redirectUri = __DEV__
    ? GOOGLE_DEV_REDIRECT_URI
    : Platform.OS === 'ios'
      ? GOOGLE_IOS_REDIRECT_URI
      : `com.darui3018823.subscriptionapp:/oauth2redirect`;


  const [request, response, promptAsync] = Google.useAuthRequest({
    // In dev, use webClientId for all platforms so the HTTPS proxy redirect URI is accepted.
    // In production, use platform-specific client IDs with their native redirect URIs.
    iosClientId: __DEV__ ? GOOGLE_WEB_CLIENT_ID : GOOGLE_IOS_CLIENT_ID,
    androidClientId: __DEV__ ? GOOGLE_WEB_CLIENT_ID : GOOGLE_ANDROID_CLIENT_ID,
    webClientId: GOOGLE_WEB_CLIENT_ID,
    scopes: ['https://www.googleapis.com/auth/gmail.readonly'],
    redirectUri,
  });

  useEffect(() => {
    if (response?.type !== 'success') return;
    const accessToken = response.authentication?.accessToken;
    if (!accessToken) return;

    (async () => {
      try {
        const email = await fetchGoogleUserEmail(accessToken);
        await setSignedIn(accessToken, email);
        await syncPaidy();
      } catch {
        Alert.alert(t('common.error'), t('gmail.error_signin'));
      }
    })();
  }, [response]);

  useEffect(() => {
    if (error) {
      Alert.alert(t('common.error'), t('gmail.error_sync'));
      clearError();
    }
  }, [error]);

  const handleSignOut = () => {
    Alert.alert(
      t('gmail.sign_out'),
      t('gmail.sign_out_confirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('gmail.sign_out'), style: 'destructive', onPress: () => signOut() },
      ]
    );
  };

  return (
    <View className="flex-1 bg-neutral-50 dark:bg-black">
      <Stack.Screen options={{ title: `${t('gmail.settings_title')} β` }} />
      <ScrollView
        className="flex-1 px-4"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 32, paddingBottom: 60 }}
      >
        {isSignedIn ? (
          <>
            {/* Connected status */}
            <View className="bg-white dark:bg-[#1C1C1E] rounded-2xl overflow-hidden border border-neutral-200 dark:border-white/10 mb-4">
              <View className="flex-row items-center px-4 py-4 border-b border-neutral-100 dark:border-white/5">
                <View
                  className="w-9 h-9 rounded-lg items-center justify-center mr-3"
                  style={{ backgroundColor: connectedStatusBackgroundColor }}
                >
                  <Ionicons name="checkmark-circle" size={20} color={connectedStatusColor} />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                    {t('gmail.connected_as', { email: '' })}
                  </Text>
                  <Text className="text-base font-semibold text-neutral-900 dark:text-white" numberOfLines={1}>
                    {googleEmail}
                  </Text>
                </View>
              </View>

              {paidyAmount != null && (
                <View className="px-4 py-4 border-b border-neutral-100 dark:border-white/5">
                  <Text className="text-sm text-neutral-500 dark:text-neutral-400 mb-1">
                    {paidyMonth ? `${paidyMonth}分` : ''} {t('paidy_detail.total_amount')}
                  </Text>
                  <Text className="text-2xl font-bold text-neutral-900 dark:text-white">
                    ¥{paidyAmount.toLocaleString()}
                  </Text>
                </View>
              )}

              <View className="px-4 py-3">
                <Text className="text-sm text-neutral-400 dark:text-neutral-500">
                  {t('gmail.last_synced', {
                    datetime: lastSyncedAt ? new Date(lastSyncedAt).toLocaleString('ja-JP') : '—',
                  })}
                </Text>
              </View>
            </View>

            {/* Re-auth banner: access token expired or missing on this device */}
            {needsReauth && (
              <View
                className="rounded-2xl border px-4 py-4 mb-3"
                style={{ backgroundColor: reauthSurfaceColor, borderColor: reauthBorderColor }}
              >
                <View className="flex-row items-start mb-3">
                  <Ionicons name="warning-outline" size={18} color={reauthAccentColor} style={{ marginTop: 1, marginRight: 8 }} />
                  <Text className="text-sm flex-1" style={{ color: reauthTextColor }}>
                    {t('gmail.reauth_required')}
                  </Text>
                </View>
                <Pressable
                  onPress={() => promptAsync()}
                  disabled={!request || isLoading}
                  className="items-center py-3 rounded-xl bg-white/80 dark:bg-[#1C1C1E] border"
                  style={{ borderColor: reauthBorderColor }}
                >
                  <Text className="font-bold text-base" style={{ color: reauthAccentColor }}>
                    {t('gmail.reauth_button')}
                  </Text>
                </Pressable>
              </View>
            )}

            {/* Sync now */}
            <Pressable
              onPress={syncPaidy}
              disabled={isLoading}
              className="items-center py-4 rounded-xl bg-white dark:bg-[#1C1C1E] border border-neutral-200/50 dark:border-white/10 mb-3"
            >
              {isLoading
                ? <ActivityIndicator color="#3B82F6" />
                : <Text className="text-blue-500 font-bold text-base">{t('gmail.sync_now')}</Text>
              }
            </Pressable>

            {/* Disconnect */}
            <Pressable
              onPress={handleSignOut}
              disabled={isLoading}
              className="items-center py-4 rounded-xl bg-white dark:bg-[#1C1C1E] border border-neutral-200/50 dark:border-white/10"
            >
              <Text className="text-red-600 dark:text-red-400 font-bold text-base">
                {t('gmail.sign_out')}
              </Text>
            </Pressable>
          </>
        ) : (
          <>
            {/* Not connected */}
            <View className="items-center py-10">
              <View className="w-16 h-16 rounded-full bg-neutral-100 dark:bg-white/10 items-center justify-center mb-4">
                <Ionicons name="mail-outline" size={32} color={isDark ? '#71717a' : '#9ca3af'} />
              </View>
              <Text className="text-base font-semibold text-neutral-700 dark:text-neutral-300 mb-2 text-center">
                {t('gmail.not_connected')}
              </Text>
              <Text className="text-sm text-neutral-400 dark:text-neutral-500 text-center px-4">
                {t('gmail.sign_in_description')}
              </Text>
            </View>

            <Pressable
              onPress={() => promptAsync()}
              disabled={!request || isLoading}
              className="items-center py-4 rounded-xl bg-white dark:bg-[#1C1C1E] border border-neutral-200/50 dark:border-white/10"
            >
              {isLoading
                ? <ActivityIndicator color="#3B82F6" />
                : (
                  <View className="flex-row items-center">
                    <Ionicons name="logo-google" size={20} color="#3B82F6" style={{ marginRight: 8 }} />
                    <Text className="text-blue-500 font-bold text-base">{t('gmail.sign_in')}</Text>
                  </View>
                )
              }
            </Pressable>

</>
        )}

        {/* About section */}
        <View className="mt-6 bg-white dark:bg-[#1C1C1E] rounded-2xl overflow-hidden border border-neutral-200 dark:border-white/10 px-4 py-4">
          <Text className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 mb-3">
            {t('gmail.about_title')}
          </Text>
          <View className="flex-row items-start mb-2">
            <Ionicons name="refresh-outline" size={15} color="#9ca3af" style={{ marginTop: 1, marginRight: 6 }} />
            <Text className="text-sm text-neutral-600 dark:text-neutral-400 flex-1">{t('gmail.about_resync')}</Text>
          </View>
          <View className="flex-row items-start mb-3">
            <Ionicons name="shield-checkmark-outline" size={15} color="#9ca3af" style={{ marginTop: 1, marginRight: 6 }} />
            <Text className="text-sm text-neutral-600 dark:text-neutral-400 flex-1">{t('gmail.about_privacy')}</Text>
          </View>
          <Pressable onPress={() => Linking.openURL(DOCS_URL)} className="flex-row items-center">
            <Ionicons name="open-outline" size={14} color="#3b82f6" style={{ marginRight: 4 }} />
            <Text className="text-sm text-blue-500">{t('gmail.about_docs')}</Text>
          </Pressable>
        </View>

        {/* Tester invitation section */}
        <View className="mt-3 bg-white dark:bg-[#1C1C1E] rounded-2xl overflow-hidden border border-neutral-200 dark:border-white/10 px-4 py-4 mb-2">
          <Text className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 mb-2">
            {t('gmail.about_tester_title')}
          </Text>
          <Text className="text-sm text-neutral-600 dark:text-neutral-400 mb-3">
            {t('gmail.about_tester_body')}
          </Text>
          <Pressable
            onPress={() => {
              const email = t('gmail.about_tester_email');
              Linking.canOpenURL(`mailto:${email}`).then(supported => {
                if (supported) {
                  Linking.openURL(`mailto:${email}`);
                } else {
                  Alert.alert(email);
                }
              });
            }}
            className="flex-row items-center"
          >
            <Ionicons name="mail-outline" size={14} color="#3b82f6" style={{ marginRight: 4 }} />
            <Text className="text-sm text-blue-500">{t('gmail.about_tester_email')}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
