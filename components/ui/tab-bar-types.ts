import { Tabs } from 'expo-router';
import type React from 'react';

export type CustomTabBarProps = Parameters<
  NonNullable<React.ComponentProps<typeof Tabs>['tabBar']>
>[0];
