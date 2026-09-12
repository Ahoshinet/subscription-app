import { Stack } from 'expo-router';
import React from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { SETTINGS_DARK_BACKGROUND } from '@/constants/settings-theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const SECTIONS = [
  { title: 'tos.s1_title', body: 'tos.s1_body' },
  { title: 'tos.s2_title', body: 'tos.s2_body' },
  { title: 'tos.s3_title', body: 'tos.s3_body' },
  { title: 'tos.s4_title', body: 'tos.s4_body' },
  { title: 'tos.s5_title', body: 'tos.s5_body' },
  { title: 'tos.s6_title', body: 'tos.s6_body' },
  { title: 'tos.s7_title', body: 'tos.s7_body' },
  { title: 'tos.s8_title', body: 'tos.s8_body' },
  { title: 'tos.s9_title', body: 'tos.s9_body' },
  { title: 'tos.s10_title', body: 'tos.s10_body' },
  { title: 'tos.s11_title', body: 'tos.s11_body' },
] as const;

const CONTACT_URL = 'https://corp.daruks.com/contact';

export default function TosScreen() {
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
          title: t('tos.title'),
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
            {t('tos.effective_date')}
          </Text>

          <View
            className="bg-white dark:bg-[#1C1C1E] rounded-2xl mb-8 overflow-hidden"
            testID="ios-tos-card"
          >
            {SECTIONS.map((section, index) => {
              const isLast = index === SECTIONS.length - 1;
              return (
                <View key={section.title} className="px-5 py-5">
                  <Text className="text-sm font-bold text-neutral-900 dark:text-white mb-2">
                    {t(section.title)}
                  </Text>
                  {section.title === 'tos.s11_title' ? (
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
                      testID={`ios-tos-separator-${index}`}
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
