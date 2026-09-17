import React from 'react';
import { describe, expect, jest, test } from '@jest/globals';
import { act, render } from '@testing-library/react-native';
import { ScrollView } from 'react-native';
import { NavigationContext } from 'expo-router/build/react-navigation/core/NavigationContext';
import { NavigationRouteContext } from 'expo-router/build/react-navigation/core/NavigationProvider';

import CalendarScreen from '@/app/(tabs)/calendar';
import SettingsScreen from '@/app/(tabs)/settings';

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  useScrollToTop: jest.requireActual<typeof import('expo-router')>(
    'expo-router/build/react-navigation/native/useScrollToTop',
  ).useScrollToTop,
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: () => null,
  FontAwesome5: () => null,
}));
jest.mock('@react-native-community/datetimepicker', () => () => null);
jest.mock('react-native-reanimated', () => ({
  __esModule: true,
  default: { View: jest.requireActual<typeof import('react-native')>('react-native').View },
  useSharedValue: (value: unknown) => ({ value }),
  useAnimatedStyle: (style: () => object) => style(),
  withTiming: (value: unknown) => value,
  withSpring: (value: unknown) => value,
}));
jest.mock('react-native-worklets', () => ({ scheduleOnRN: jest.fn() }));
jest.mock('react-native-gesture-handler', () => ({
  GestureDetector: ({ children }: React.PropsWithChildren) => children,
  Gesture: {
    Pan: () => ({
      activeOffsetX: jest.fn().mockReturnThis(),
      failOffsetY: jest.fn().mockReturnThis(),
      onUpdate: jest.fn().mockReturnThis(),
      onEnd: jest.fn().mockReturnThis(),
    }),
  },
}));
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'en' } }),
}));
jest.mock('@/hooks/use-color-scheme', () => ({ useColorScheme: () => 'light' }));
jest.mock('@/store/useAuthStore', () => ({
  useAuthStore: () => ({ user: { username: 'Test' }, logout: jest.fn() }),
}));
jest.mock('@/store/useSettingsStore', () => ({
  useSettingsStore: () => ({ language: 'en', timeZone: 'Asia/Tokyo' }),
}));
jest.mock('@/store/usePaidyStore', () => ({
  usePaidyStore: () => ({ isSignedIn: false }),
}));
jest.mock('@/store/useSubscriptionStore', () => ({
  useSubscriptionStore: () => ({ subscriptions: [], fetchSubscriptions: jest.fn() }),
}));
jest.mock('@/lib/api', () => ({ resolveIconUrl: (url: string) => url }));

describe.each([
  { name: 'Calendar', Screen: CalendarScreen },
  { name: 'Settings', Screen: SettingsScreen },
])('$name tab scrolling', ({ name, Screen }) => {
  test('scrolls its list on reselection, preserves it when inactive, and cleans up', async () => {
    const listeners = new Set<(event: { defaultPrevented: boolean }) => void>();
    const navigation = {
      getState: () => ({ type: 'tab' }),
      getParent: () => undefined,
      isFocused: jest.fn(() => true),
      addListener: (name: string, listener: (event: { defaultPrevented: boolean }) => void) => {
        expect(name).toBe('tabPress');
        listeners.add(listener);
        return () => listeners.delete(listener);
      },
    };
    const frames: FrameRequestCallback[] = [];
    const frameSpy = jest.spyOn(global, 'requestAnimationFrame').mockImplementation(callback => {
      frames.push(callback);
      return frames.length;
    });

    try {
      const screen = await render(
        <NavigationContext.Provider value={navigation as unknown as React.ContextType<typeof NavigationContext>}>
          <NavigationRouteContext.Provider value={{ key: 'screen', name }}>
            <Screen />
          </NavigationRouteContext.Provider>
        </NavigationContext.Provider>,
      );
      const scrollTo = jest.mocked(ScrollView.prototype.scrollTo);
      const pressTab = async (defaultPrevented = false) => {
        await act(() => {
          listeners.forEach(listener => listener({ defaultPrevented }));
          frames.splice(0).forEach(callback => callback(0));
        });
      };

      expect(listeners.size).toBe(1);
      await pressTab();
      expect(scrollTo).toHaveBeenLastCalledWith({ y: 0, animated: true });
      expect(scrollTo).toHaveBeenCalledTimes(1);

      navigation.isFocused.mockReturnValue(false);
      await pressTab();
      expect(scrollTo).toHaveBeenCalledTimes(1);

      navigation.isFocused.mockReturnValue(true);
      await pressTab(true);
      expect(scrollTo).toHaveBeenCalledTimes(1);

      await screen.unmount();
      expect(listeners.size).toBe(0);
    } finally {
      frameSpy.mockRestore();
    }
  });
});
