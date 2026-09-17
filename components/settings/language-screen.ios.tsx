import { Stack, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { SETTINGS_DARK_BACKGROUND } from '@/constants/settings-theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSettingsStore, type Language } from '@/store/useSettingsStore';

const languages: readonly { id: Language; localName: string }[] = [
  { id: 'en', localName: 'English' },
  { id: 'ja', localName: '日本語' },
];

export default function LanguageSettingsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { language, setLanguage } = useSettingsStore();
  const backgroundColor = isDark ? SETTINGS_DARK_BACKGROUND : '#FAFAFA';

  const handleSelect = (id: Language) => {
    setLanguage(id);
    void i18n.changeLanguage(id);
    setTimeout(() => {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.navigate('/(tabs)/settings');
      }
    }, 250);
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: t('settings.language'),
          headerBackTitle: ' ',
          headerShadowVisible: false,
          headerStyle: { backgroundColor },
          headerTintColor: isDark ? '#FFFFFF' : '#000000',
        }}
      />

      <View className="flex-1 pt-6" style={{ backgroundColor }}>
        <ScrollView className="flex-1 px-4">
          <View
            className="rounded-2xl overflow-hidden"
            testID="ios-language-list"
          >
            {languages.map((item, index) => {
              const isSelected = language === item.id;
              const isLast = index === languages.length - 1;
              return (
                <Pressable
                  key={item.id}
                  onPress={() => handleSelect(item.id)}
                  style={{ minHeight: 56 }}
                  className="bg-white dark:bg-[#1C1C1E] flex-row items-center justify-between px-4 py-3"
                >
                  <Text className="flex-1 text-base font-medium text-neutral-900 dark:text-white">
                    {item.localName}
                  </Text>
                  {isSelected ? (
                    <SymbolView
                      name="checkmark"
                      resizeMode="scaleAspectFit"
                      style={styles.checkmark}
                      tintColor="#3B82F6"
                      weight="semibold"
                    />
                  ) : null}
                  {!isLast ? (
                    <View
                      pointerEvents="none"
                      style={[
                        styles.separator,
                        {
                          backgroundColor: isDark
                            ? 'rgba(84, 84, 88, 0.65)'
                            : 'rgba(60, 60, 67, 0.29)',
                        },
                      ]}
                      testID="ios-language-separator"
                    />
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  checkmark: {
    height: 24,
    width: 24,
  },
  separator: {
    bottom: 0,
    height: StyleSheet.hairlineWidth,
    left: 16,
    position: 'absolute',
    right: 16,
  },
});
