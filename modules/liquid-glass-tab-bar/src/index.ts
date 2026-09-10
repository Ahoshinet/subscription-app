import { requireNativeViewManager } from 'expo-modules-core';
import React from 'react';
import type { NativeSyntheticEvent, ViewProps } from 'react-native';

export type LiquidGlassTabPressEvent = {
  index: number;
};

export type LiquidGlassTabBarProps = ViewProps & {
  selectedIndex: number;
  colorScheme?: 'light' | 'dark';
  onTabPress?: (event: NativeSyntheticEvent<LiquidGlassTabPressEvent>) => void;
};

const NativeLiquidGlassTabBar = requireNativeViewManager<LiquidGlassTabBarProps>(
  'LiquidGlassTabBar',
  'LiquidGlassTabBarView'
);

export function LiquidGlassTabBar(props: LiquidGlassTabBarProps) {
  return React.createElement(NativeLiquidGlassTabBar, props);
}
