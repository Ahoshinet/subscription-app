import React from 'react';
import { StyleSheet, View } from 'react-native';

import { LiquidGlassTabBar } from '@/modules/liquid-glass-tab-bar/src';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { CustomTabBarProps } from '@/components/ui/tab-bar-types';

export default function CustomTabBar({ state, navigation }: CustomTabBarProps) {
  const colorScheme = useColorScheme();
  const nativeColorScheme = colorScheme === 'dark' || colorScheme === 'light' ? colorScheme : undefined;
  const onTabPress = ({ nativeEvent }: { nativeEvent: { index: number } }) => {
    const route = state.routes[nativeEvent.index];
    if (!route) return;

    const event = navigation.emit({
      type: 'tabPress',
      target: route.key,
      canPreventDefault: true,
    });

    if (state.index !== nativeEvent.index && !event.defaultPrevented) {
      navigation.navigate(route.name);
    }
  };

  return (
    <View style={styles.shadowContainer}>
      <View style={styles.innerContainer}>
        <LiquidGlassTabBar
          selectedIndex={state.index}
          colorScheme={nativeColorScheme}
          onTabPress={onTabPress}
          style={styles.host}
        />
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
  host: {
    flex: 1,
  },
});
