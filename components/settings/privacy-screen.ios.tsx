import { Stack } from 'expo-router';
import React from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { SETTINGS_DARK_BACKGROUND } from '@/constants/settings-theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const SECTIONS = [
  { title: 'privacy.s1_title', body: 'privacy.s1_body' },
  { title: 'privacy.s2_title', body: 'privacy.s2_body' },
  { title: 'privacy.s3_title', body: 'privacy.s3_body' },
  { title: 'privacy.s4_title', body: 'privacy.s4_body' },
  { title: 'privacy.s5_title', body: 'privacy.s5_body' },
  { title: 'privacy.s6_title', body: 'privacy.s6_body' },
  { title: 'privacy.s7_title', body: 'privacy.s7_body' },
  { title: 'privacy.s8_title', body: 'privacy.s8_body' },
  { title: 'privacy.s9_title', body: 'privacy.s9_body' },
  { title: 'privacy.s10_title', body: 'privacy.s10_body' },
  { title: 'privacy.s11_title', body: 'privacy.s11_body' },
  { title: 'privacy.s12_title', body: 'privacy.s12_body' },
] as const;

const CONTACT_URL = 'https://corp.daruks.com/contact';

export default function PrivacyScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { t } = useTranslation();
  const backgroundColor = isDark ? SETTINGS_DARK_BACKGROUND : '#FAFAFA';
  const separatorColor = isDark
    ? 'rgba(84, 84, 88, 0.65)'
    : 'rgba(60, 60, 67, 0.29)';

  return (
    <>
      <Stack.Screen
        options={{
          title: t('privacy.title'),
          headerBackTitle: ' ',
          headerShadowVisible: false,
          headerStyle: { backgroundColor },
          headerTintColor: isDark ? '#FFFFFF' : '#000000',
        }}
      />
      <View className="flex-1" style={{ backgroundColor }}>
        <ScrollView
          className="flex-1 px-4"
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text className="text-xs text-neutral-400 dark:text-neutral-500 mb-4 ml-1">
            {t('privacy.effective_date')}
          </Text>

          <View
            className="bg-white dark:bg-[#1C1C1E] rounded-2xl mb-8 overflow-hidden"
            testID="ios-privacy-card"
          >
            {SECTIONS.map((section, index) => {
              const isLast = index === SECTIONS.length - 1;
              return (
                <View key={section.title} className="px-5 py-5">
                  <Text className="text-sm font-bold text-neutral-900 dark:text-white mb-2">
                    {t(section.title)}
                  </Text>
                  {section.title === 'privacy.s11_title' ? (
                    <View>
                      <Text className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed mb-2">
                        {t(section.body).split(CONTACT_URL)[0]}
                      </Text>
                      <Pressable onPress={() => Linking.openURL(CONTACT_URL)}>
                        <Text className="text-sm text-blue-500 dark:text-blue-400 leading-relaxed">
                          {CONTACT_URL}
                        </Text>
                      </Pressable>
                    </View>
                  ) : (
                    <Text className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
                      {t(section.body)}
                    </Text>
                  )}
                  {!isLast ? (
                    <View
                      pointerEvents="none"
                      style={[
                        styles.separator,
                        { backgroundColor: separatorColor },
                      ]}
                      testID={`ios-privacy-separator-${index}`}
                    />
                  ) : null}
                </View>
              );
            })}
          </View>
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingTop: 24,
  },
  separator: {
    bottom: 0,
    height: StyleSheet.hairlineWidth,
    left: 16,
    position: 'absolute',
    right: 16,
  },
});
