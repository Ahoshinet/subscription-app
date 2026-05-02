import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as AuthSession from 'expo-auth-session';
import { View, Text, Pressable, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';
import { usePaidyStore } from '@/store/usePaidyStore';
import { fetchGoogleUserEmail } from '@/lib/gmail';
import { GOOGLE_IOS_CLIENT_ID, GOOGLE_ANDROID_CLIENT_ID, GOOGLE_WEB_CLIENT_ID, GOOGLE_DEV_REDIRECT_URI } from '@/constants/googleConfig';

WebBrowser.maybeCompleteAuthSession();

export default function GmailSettingsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { t } = useTranslation();

  const {
    isSignedIn,
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
    : AuthSession.makeRedirectUri({ native: 'subscriptionapp://oauth' });

  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId: GOOGLE_IOS_CLIENT_ID,
    androidClientId: GOOGLE_ANDROID_CLIENT_ID,
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
      <Stack.Screen options={{ title: t('gmail.settings_title') }} />
      <ScrollView
        className="flex-1 px-4"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 60 }}
      >
        {isSignedIn ? (
          <>
            {/* Connected status */}
            <View className="bg-white dark:bg-[#1C1C1E] rounded-2xl overflow-hidden border border-neutral-200 dark:border-white/10 mb-4">
              <View className="flex-row items-center px-4 py-4 border-b border-neutral-100 dark:border-white/5">
                <View className="w-9 h-9 rounded-lg bg-green-100 dark:bg-green-900/30 items-center justify-center mr-3">
                  <Ionicons name="checkmark-circle" size={20} color="#22c55e" />
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

            {/* Sync now */}
            <Pressable
              onPress={syncPaidy}
              disabled={isLoading}
              className="items-center py-4 rounded-xl bg-blue-500 mb-3"
            >
              {isLoading
                ? <ActivityIndicator color="#fff" />
                : <Text className="text-white font-bold text-base">{t('gmail.sync_now')}</Text>
              }
            </Pressable>

            {/* Disconnect */}
            <Pressable
              onPress={handleSignOut}
              disabled={isLoading}
              className="items-center py-4 rounded-xl bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-900/50"
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
              className="items-center py-4 rounded-xl bg-blue-500"
            >
              {isLoading
                ? <ActivityIndicator color="#fff" />
                : (
                  <View className="flex-row items-center">
                    <Ionicons name="logo-google" size={20} color="#fff" style={{ marginRight: 8 }} />
                    <Text className="text-white font-bold text-base">{t('gmail.sign_in')}</Text>
                  </View>
                )
              }
            </Pressable>

</>
        )}
      </ScrollView>
    </View>
  );
}
