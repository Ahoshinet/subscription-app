import React from 'react';
import { useTranslation } from 'react-i18next';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const searchBackgroundColor = colorScheme === 'dark' ? '#000000' : '#FAFAFA';

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NativeTabs>
        <NativeTabs.Trigger name="index">
          <NativeTabs.Trigger.Icon sf={{ default: 'house', selected: 'house.fill' }} />
          <NativeTabs.Trigger.Label>{t('tabs.home')}</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="calendar">
          <NativeTabs.Trigger.Icon sf="calendar" />
          <NativeTabs.Trigger.Label>{t('tabs.calendar')}</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="settings">
          <NativeTabs.Trigger.Icon sf={{ default: 'gearshape', selected: 'gearshape.fill' }} />
          <NativeTabs.Trigger.Label>{t('tabs.settings')}</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger
          contentStyle={{ backgroundColor: searchBackgroundColor }}
          name="search"
          role="search"
        >
          <NativeTabs.Trigger.Label>{t('tabs.search')}</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
      </NativeTabs>
    </GestureHandlerRootView>
  );
}
