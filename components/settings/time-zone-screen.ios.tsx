import { Stack, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { SETTINGS_DARK_BACKGROUND } from '@/constants/settings-theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import {
  formatTimeZoneOffset,
  getDeviceTimeZone,
  getSupportedTimeZones,
  isTimeZoneSupported,
} from '@/lib/timeZone';
import { useSettingsStore } from '@/store/useSettingsStore';

export default function TimeZoneSettingsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const { t } = useTranslation();
  const { timeZone, setTimeZone } = useSettingsStore();
  const [query, setQuery] = useState('');
  const deviceTimeZone = getDeviceTimeZone();
  const selectedZoneSupported = isTimeZoneSupported(timeZone);
  const allTimeZones = useMemo(() => getSupportedTimeZones(), []);
  const filteredTimeZones = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return allTimeZones;
    return allTimeZones.filter((zone) => zone.toLowerCase().includes(normalized));
  }, [allTimeZones, query]);
  const backgroundColor = isDark ? SETTINGS_DARK_BACKGROUND : '#FAFAFA';

  const selectTimeZone = (zone: string) => {
    setTimeZone(zone);
    setTimeout(() => router.back(), 200);
  };

  return (
    <View className="flex-1" style={{ backgroundColor }}>
      <Stack.Screen
        options={{
          title: t('time_zone.title'),
          headerBackTitle: ' ',
          headerShadowVisible: false,
          headerStyle: { backgroundColor },
          headerTintColor: isDark ? '#FFFFFF' : '#000000',
        }}
      />
      <Stack.SearchBar
        allowToolbarIntegration
        autoCapitalize="none"
        hideWhenScrolling={false}
        obscureBackground={false}
        onChangeText={(event) => setQuery(event.nativeEvent.text)}
        placeholder={t('time_zone.search')}
        placement="integrated"
      />
      <Stack.Toolbar placement="bottom">
        <Stack.Toolbar.SearchBarSlot />
      </Stack.Toolbar>

      <FlatList
        contentContainerStyle={styles.listContent}
        data={filteredTimeZones}
        initialNumToRender={20}
        keyboardShouldPersistTaps="handled"
        keyExtractor={(zone) => zone}
        maxToRenderPerBatch={20}
        testID="ios-time-zone-list"
        windowSize={10}
        ListHeaderComponent={!selectedZoneSupported ? (
          <View className="mb-4 rounded-xl bg-amber-100 dark:bg-amber-900/30 px-4 py-3">
            <Text className="text-sm text-amber-900 dark:text-amber-200">
              {t('time_zone.unsupported', { zone: timeZone })}
            </Text>
          </View>
        ) : null}
        renderItem={({ item: zone, index }) => {
          const selected = zone === timeZone;
          const isFirst = index === 0;
          const isLast = index === filteredTimeZones.length - 1;
          return (
            <Pressable
              className={[
                'bg-white dark:bg-[#1C1C1E] flex-row items-center px-4 py-3',
                isFirst ? 'rounded-t-2xl' : '',
                isLast ? 'rounded-b-2xl' : '',
              ].join(' ')}
              onPress={() => selectTimeZone(zone)}
              testID={`ios-time-zone-row-${zone}`}
            >
              <View className="flex-1 mr-3">
                <Text className="text-base font-medium text-neutral-900 dark:text-white">
                  {zone}
                </Text>
                <Text className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  {formatTimeZoneOffset(zone)}
                  {zone === deviceTimeZone ? ` · ${t('time_zone.current_device')}` : ''}
                </Text>
              </View>
              {selected ? (
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
                  testID={`ios-time-zone-separator-${zone}`}
                />
              ) : null}
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  checkmark: {
    height: 24,
    width: 24,
  },
  listContent: {
    paddingBottom: 112,
    paddingHorizontal: 16,
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
