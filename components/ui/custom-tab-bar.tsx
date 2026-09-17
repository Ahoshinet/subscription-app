import { BlurView } from 'expo-blur';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { CustomTabBarProps } from '@/components/ui/tab-bar-types';

const TAB_ICONS = {
  index: { active: 'house.fill', inactive: 'house' },
  calendar: { active: 'calendar.fill', inactive: 'calendar' },
  settings: { active: 'gearshape.fill', inactive: 'gearshape' },
} as const;

const TAB_LABEL_KEYS = {
  index: 'tabs.home',
  calendar: 'tabs.calendar',
  settings: 'tabs.settings',
} as const;

export default function CustomTabBar({ state, navigation }: CustomTabBarProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { t } = useTranslation();
  const focusedRouteKey = state.routes[state.index]?.key;
  // Search is an iOS-only primary destination until the Android Material pass.
  const visibleRoutes = state.routes.filter((route) => route.name !== 'search');

  return (
    <View style={styles.shadowContainer}>
      <View style={styles.innerContainer}>
        <BlurView
          intensity={isDark ? 50 : 80}
          tint={isDark ? 'dark' : 'light'}
          style={[
            styles.tabBar,
            {
              backgroundColor: isDark
                ? 'rgba(30, 30, 32, 0.45)'
                : 'rgba(255, 255, 255, 0.65)',
            },
          ]}
        >
          {visibleRoutes.map((route) => {
            const isFocused = focusedRouteKey === route.key;
            const tabIcon = TAB_ICONS[route.name as keyof typeof TAB_ICONS] ?? TAB_ICONS.index;
            const labelKey = TAB_LABEL_KEYS[route.name as keyof typeof TAB_LABEL_KEYS] ?? TAB_LABEL_KEYS.index;

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            return (
              <Pressable
                key={route.key}
                accessibilityRole="tab"
                accessibilityLabel={t(labelKey)}
                accessibilityState={{ selected: isFocused }}
                onPress={onPress}
                style={styles.tabItem}
              >
                <IconSymbol
                  name={isFocused ? tabIcon.active : tabIcon.inactive}
                  size={24}
                  color={
                    isFocused
                      ? isDark
                        ? '#FFFFFF'
                        : '#000000'
                      : isDark
                        ? '#8E8E93'
                        : '#636366'
                  }
                />
              </Pressable>
            );
          })}
        </BlurView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shadowContainer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    height: 60,
    marginHorizontal: 20,
    zIndex: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  innerContainer: {
    flex: 1,
    borderRadius: 30,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(128, 128, 128, 0.25)',
  },
  tabBar: {
    ...StyleSheet.absoluteFill,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
});
