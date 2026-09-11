import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, View } from 'react-native';

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
          <Text className="text-xs font-bold text-neutral-500 dark:text-neutral-400 tracking-wider ml-4 mb-2">
            Select Language
          </Text>

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
                  className={`bg-white dark:bg-[#1C1C1E] flex-row items-center justify-between px-4 py-3 ${
                    !isLast ? 'border-b border-neutral-100 dark:border-white/5' : ''
                  }`}
                >
                  <Text className="flex-1 text-base font-medium text-neutral-900 dark:text-white">
                    {item.localName}
                  </Text>
                  {isSelected ? (
                    <Ionicons name="checkmark" size={24} color="#3B82F6" />
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
