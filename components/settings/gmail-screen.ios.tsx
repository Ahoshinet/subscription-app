import { Ionicons } from '@expo/vector-icons';
import * as Google from 'expo-auth-session/providers/google';
import { Stack } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  GOOGLE_ANDROID_CLIENT_ID,
  GOOGLE_DEV_REDIRECT_URI,
  GOOGLE_IOS_CLIENT_ID,
  GOOGLE_IOS_REDIRECT_URI,
  GOOGLE_WEB_CLIENT_ID,
} from '@/constants/googleConfig';
import { SETTINGS_DARK_BACKGROUND } from '@/constants/settings-theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { fetchGoogleUserEmail } from '@/lib/gmail';
import { usePaidyStore } from '@/store/usePaidyStore';

const DOCS_URL = 'https://github.com/Ahoshinet/subscription-app/blob/main/docs/gmail-integration.md';
const RAINBOW_STOPS = [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1];
const LIGHT_RAINBOW_COLORS = ['#ffffff', '#fee2e2', '#ffedd5', '#fef3c7', '#dcfce7', '#cffafe', '#dbeafe', '#f3e8ff', '#ffffff'];
const DARK_RAINBOW_COLORS = ['#1c1c1e', '#48171f', '#47270d', '#403a0b', '#103a24', '#0b3542', '#18274a', '#351644', '#1c1c1e'];

export default function GmailSettingsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { t } = useTranslation();
  const [gamingProgress] = useState(() => new Animated.Value(0));
  const gamingAnimation = useRef<Animated.CompositeAnimation | null>(null);
  const gamingBackgroundColor = gamingProgress.interpolate({
    inputRange: RAINBOW_STOPS,
    outputRange: isDark ? DARK_RAINBOW_COLORS : LIGHT_RAINBOW_COLORS,
  });
  const backgroundColor = isDark ? SETTINGS_DARK_BACKGROUND : '#FAFAFA';
  const separatorColor = isDark
    ? 'rgba(84, 84, 88, 0.65)'
    : 'rgba(60, 60, 67, 0.29)';

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
      : 'com.darui3018823.subscriptionapp:/oauth2redirect';

  const [request, response, promptAsync] = Google.useAuthRequest({
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
  }, [response, setSignedIn, syncPaidy, t]);

  useEffect(() => {
    if (!error) return;
    Alert.alert(t('common.error'), t('gmail.error_sync'));
    clearError();
  }, [clearError, error, t]);

  const handleSignOut = () => {
    Alert.alert(
      t('gmail.sign_out'),
      t('gmail.sign_out_confirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('gmail.sign_out'), style: 'destructive', onPress: () => signOut() },
      ],
    );
  };

  const startGamingEffect = () => {
    gamingAnimation.current?.stop();
    gamingProgress.setValue(0);
    gamingAnimation.current = Animated.loop(
      Animated.timing(gamingProgress, {
        toValue: 1,
        duration: 1800,
        easing: Easing.linear,
        useNativeDriver: false,
      }),
      { iterations: 3 },
    );
    gamingAnimation.current.start();
  };

  const separator = (testID: string) => (
    <View
      pointerEvents="none"
      style={[styles.separator, { backgroundColor: separatorColor }]}
      testID={testID}
    />
  );

  return (
    <View className="flex-1" style={{ backgroundColor }}>
      <Stack.Screen
        options={{
          title: `${t('gmail.settings_title')} β`,
          headerShown: true,
          headerBackTitle: ' ',
          headerShadowVisible: false,
          headerStyle: { backgroundColor },
          headerTintColor: isDark ? '#FFFFFF' : '#000000',
        }}
      />
      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isSignedIn ? (
          <>
            <View
              className="bg-white dark:bg-[#1C1C1E] rounded-2xl overflow-hidden mb-4"
              testID="ios-gmail-connected-card"
            >
              <Pressable onPress={startGamingEffect} accessibilityRole="button">
                <Animated.View style={{ backgroundColor: gamingBackgroundColor }}>
                  <View className="flex-row items-center px-4 py-4">
                    <View className="w-9 h-9 items-center justify-center mr-3">
                      <SymbolView
                        name="checkmark"
                        resizeMode="scaleAspectFit"
                        style={styles.statusIcon}
                        tintColor={isDark ? '#737373' : '#171717'}
                        weight="semibold"
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                        {t('gmail.connected_as', { email: '' })}
                      </Text>
                      <Text className="text-base font-semibold text-neutral-900 dark:text-white" numberOfLines={1}>
                        {googleEmail}
                      </Text>
                    </View>
                    {separator('ios-gmail-connected-separator')}
                  </View>
                </Animated.View>
              </Pressable>

              {paidyAmount != null ? (
                <View className="px-4 py-4">
                  <Text className="text-sm text-neutral-500 dark:text-neutral-400 mb-1">
                    {paidyMonth ? `${paidyMonth}分` : ''} {t('paidy_detail.total_amount')}
                  </Text>
                  <Text className="text-2xl font-bold text-neutral-900 dark:text-white">
                    ¥{paidyAmount.toLocaleString()}
                  </Text>
                  {separator('ios-gmail-amount-separator')}
                </View>
              ) : null}

              <View className="px-4 py-3">
                <Text className="text-sm text-neutral-400 dark:text-neutral-500">
                  {t('gmail.last_synced', {
                    datetime: lastSyncedAt ? new Date(lastSyncedAt).toLocaleString('ja-JP') : '—',
                  })}
                </Text>
              </View>
            </View>

            {needsReauth ? (
              <View
                className="bg-white dark:bg-[#1C1C1E] rounded-2xl px-4 py-4 mb-3"
                testID="ios-gmail-reauth-card"
              >
                <View className="flex-row items-start mb-3">
                  <SymbolView
                    name="exclamationmark.triangle"
                    resizeMode="scaleAspectFit"
                    style={styles.inlineIcon}
                    tintColor={isDark ? '#8C8C93' : '#9CA3AF'}
                  />
                  <Text className="text-sm text-neutral-600 dark:text-neutral-400 flex-1">
                    {t('gmail.reauth_required')}
                  </Text>
                </View>
                <Pressable
                  className="items-center py-3 rounded-xl bg-neutral-50 dark:bg-white/5"
                  disabled={!request || isLoading}
                  onPress={() => promptAsync()}
                  testID="ios-gmail-reauth-button"
                >
                  <Text className="text-amber-600 dark:text-amber-400 font-bold text-base">
                    {t('gmail.reauth_button')}
                  </Text>
                </Pressable>
              </View>
            ) : null}

            <Pressable
              className="items-center py-4 rounded-xl bg-white dark:bg-[#1C1C1E] mb-3"
              disabled={isLoading}
              onPress={syncPaidy}
              testID="ios-gmail-sync-button"
            >
              {isLoading ? (
                <ActivityIndicator color="#3B82F6" />
              ) : (
                <Text className="text-blue-500 font-bold text-base">{t('gmail.sync_now')}</Text>
              )}
            </Pressable>

            <Pressable
              className="items-center py-4 rounded-xl bg-white dark:bg-[#1C1C1E]"
              disabled={isLoading}
              onPress={handleSignOut}
              testID="ios-gmail-signout-button"
            >
              <Text className="text-red-600 dark:text-red-400 font-bold text-base">
                {t('gmail.sign_out')}
              </Text>
            </Pressable>
          </>
        ) : (
          <>
            <View className="items-center py-10">
              <View className="w-16 h-16 rounded-full bg-neutral-100 dark:bg-white/10 items-center justify-center mb-4">
                <SymbolView
                  name="envelope"
                  resizeMode="scaleAspectFit"
                  style={styles.emptyIcon}
                  tintColor={isDark ? '#71717A' : '#9CA3AF'}
                />
              </View>
              <Text className="text-base font-semibold text-neutral-700 dark:text-neutral-300 mb-2 text-center">
                {t('gmail.not_connected')}
              </Text>
              <Text className="text-sm text-neutral-400 dark:text-neutral-500 text-center px-4">
                {t('gmail.sign_in_description')}
              </Text>
            </View>

            <Pressable
              className="items-center py-4 rounded-xl bg-white dark:bg-[#1C1C1E]"
              disabled={!request || isLoading}
              onPress={() => promptAsync()}
              testID="ios-gmail-signin-button"
            >
              {isLoading ? (
                <ActivityIndicator color="#3B82F6" />
              ) : (
                <View className="flex-row items-center">
                  <Ionicons name="logo-google" size={20} color="#3B82F6" style={styles.googleIcon} />
                  <Text className="text-blue-500 font-bold text-base">{t('gmail.sign_in')}</Text>
                </View>
              )}
            </Pressable>
          </>
        )}

        <View
          className="mt-6 bg-white dark:bg-[#1C1C1E] rounded-2xl overflow-hidden px-4 py-4"
          testID="ios-gmail-about-card"
        >
          <View className="flex-row items-start mb-2">
            <SymbolView
              name="arrow.clockwise"
              resizeMode="scaleAspectFit"
              style={styles.detailIcon}
              tintColor="#9CA3AF"
            />
            <Text className="text-sm text-neutral-600 dark:text-neutral-400 flex-1">{t('gmail.about_resync')}</Text>
          </View>
          <View className="flex-row items-start mb-3">
            <SymbolView
              name="checkmark.shield"
              resizeMode="scaleAspectFit"
              style={styles.detailIcon}
              tintColor="#9CA3AF"
            />
            <Text className="text-sm text-neutral-600 dark:text-neutral-400 flex-1">{t('gmail.about_privacy')}</Text>
          </View>
          <Pressable onPress={() => Linking.openURL(DOCS_URL)} className="flex-row items-center">
            <SymbolView
              name="arrow.up.right.square"
              resizeMode="scaleAspectFit"
              style={styles.linkIcon}
              tintColor="#3B82F6"
            />
            <Text className="text-sm text-blue-500">{t('gmail.about_docs')}</Text>
          </Pressable>
        </View>

        <View
          className="mt-3 bg-white dark:bg-[#1C1C1E] rounded-2xl overflow-hidden px-4 py-4 mb-2"
          testID="ios-gmail-beta-card"
        >
          <Text className="text-sm text-neutral-600 dark:text-neutral-400 mb-3">
            {t('gmail.about_tester_body')}
          </Text>
          <Pressable
            className="flex-row items-center"
            onPress={() => {
              const email = t('gmail.about_tester_email');
              void Linking.canOpenURL(`mailto:${email}`)
                .then((supported) => {
                  if (supported) return Linking.openURL(`mailto:${email}`);
                  Alert.alert(email);
                })
                .catch(() => Alert.alert(email));
            }}
          >
            <SymbolView
              name="envelope"
              resizeMode="scaleAspectFit"
              style={styles.linkIcon}
              tintColor="#3B82F6"
            />
            <Text className="text-sm text-blue-500">{t('gmail.about_tester_email')}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  detailIcon: {
    height: 15,
    marginRight: 7,
    marginTop: 1,
    width: 15,
  },
  emptyIcon: {
    height: 32,
    width: 32,
  },
  googleIcon: {
    marginRight: 8,
  },
  inlineIcon: {
    height: 18,
    marginRight: 8,
    marginTop: 1,
    width: 18,
  },
  linkIcon: {
    height: 15,
    marginRight: 5,
    width: 15,
  },
  scrollContent: {
    paddingBottom: 60,
    paddingTop: 32,
  },
  separator: {
    bottom: 0,
    height: StyleSheet.hairlineWidth,
    left: 16,
    position: 'absolute',
    right: 16,
  },
  statusIcon: {
    height: 26,
    width: 26,
  },
});
