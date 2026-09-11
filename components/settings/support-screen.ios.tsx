import { Stack } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { SETTINGS_DARK_BACKGROUND } from '@/constants/settings-theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function SupportScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { t } = useTranslation();
  const backgroundColor = isDark ? SETTINGS_DARK_BACKGROUND : '#FAFAFA';

  const openUrl = (url: string) => {
    void Linking.openURL(url).catch(error => console.error("Couldn't load page", error));
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: t('support.title'),
          headerBackTitle: ' ',
          headerShadowVisible: false,
          headerStyle: { backgroundColor },
          headerTintColor: isDark ? '#FFFFFF' : '#000000',
        }}
      />

      <View className="flex-1 pt-6" style={{ backgroundColor }}>
        <ScrollView className="flex-1 px-4">
          <View
            className="bg-white dark:bg-[#1C1C1E] rounded-2xl overflow-hidden mb-6"
            testID="ios-support-list"
          >
            <Pressable
              onPress={() => Alert.alert(
                t('support.coming_soon_title'),
                t('support.coming_soon_message'),
              )}
              className="flex-row items-center justify-between p-4 border-b border-neutral-100 dark:border-white/5"
            >
              <View className="flex-row items-center">
                <View className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-white/10 items-center justify-center mr-3">
                  <SymbolView
                    name="questionmark.circle"
                    resizeMode="scaleAspectFit"
                    style={styles.icon}
                    tintColor="#808080"
                  />
                </View>
                <Text className="text-base font-medium text-neutral-900 dark:text-white">
                  {t('support.faq')}
                </Text>
              </View>
              <SymbolView
                name="chevron.right"
                resizeMode="scaleAspectFit"
                style={styles.chevron}
                tintColor="#9CA3AF"
                weight="semibold"
              />
            </Pressable>

            <Pressable
              onPress={() => openUrl('mailto:subscription-manager@corp.daruks.com')}
              className="flex-row items-center justify-between p-4 border-b border-neutral-100 dark:border-white/5"
            >
              <View className="flex-row items-center">
                <View className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-white/10 items-center justify-center mr-3">
                  <SymbolView
                    name="envelope"
                    resizeMode="scaleAspectFit"
                    style={styles.icon}
                    tintColor="#808080"
                  />
                </View>
                <Text className="text-base font-medium text-neutral-900 dark:text-white">
                  {t('support.contact')}
                </Text>
              </View>
              <SymbolView
                name="chevron.right"
                resizeMode="scaleAspectFit"
                style={styles.chevron}
                tintColor="#9CA3AF"
                weight="semibold"
              />
            </Pressable>

            <Pressable
              onPress={() => openUrl('https://github.com/Ahoshinet/subscription-app/issues/new?template=bug_report.md')}
              className="flex-row items-center justify-between p-4"
            >
              <View className="flex-row items-center">
                <View className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 items-center justify-center mr-3">
                  <SymbolView
                    name="ladybug"
                    resizeMode="scaleAspectFit"
                    style={styles.icon}
                    tintColor="#EF4444"
                  />
                </View>
                <Text className="text-base font-medium text-neutral-900 dark:text-white">
                  {t('support.report_bug')}
                </Text>
              </View>
              <SymbolView
                name="chevron.right"
                resizeMode="scaleAspectFit"
                style={styles.chevron}
                tintColor="#9CA3AF"
                weight="semibold"
              />
            </Pressable>
          </View>
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  icon: {
    height: 18,
    width: 18,
  },
  chevron: {
    height: 18,
    width: 10,
  },
});
