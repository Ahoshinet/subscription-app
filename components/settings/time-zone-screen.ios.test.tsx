import { describe, expect, jest, test } from '@jest/globals';
import { render } from '@testing-library/react-native';
import React from 'react';
import { StyleSheet } from 'react-native';

import TimeZoneScreen from './time-zone-screen.ios';

let mockHeaderOptions: { headerShadowVisible?: boolean } | undefined;
const mockSearchBar = jest.fn((_props: unknown) => null);
const mockSearchBarSlot = jest.fn(() => null);
const mockSymbolView = jest.fn((_props: unknown) => null);

jest.mock('expo-router', () => {
  const Toolbar = ({ children }: { children: React.ReactNode }) => children;
  Toolbar.SearchBarSlot = () => mockSearchBarSlot();

  return {
    Stack: {
      Screen: ({ options }: { options: { headerShadowVisible?: boolean } }) => {
        mockHeaderOptions = options;
        return null;
      },
      SearchBar: (props: unknown) => mockSearchBar(props),
      Toolbar,
    },
    useRouter: () => ({ back: jest.fn() }),
  };
});

jest.mock('expo-symbols', () => ({
  SymbolView: (props: unknown) => mockSymbolView(props),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('@/hooks/use-color-scheme', () => ({
  useColorScheme: () => 'dark',
}));

jest.mock('@/lib/timeZone', () => ({
  formatTimeZoneOffset: (zone: string) => zone === 'UTC' ? 'UTC' : 'UTC+09:00',
  getDeviceTimeZone: () => 'Asia/Tokyo',
  getSupportedTimeZones: () => ['Asia/Tokyo', 'UTC'],
  isTimeZoneSupported: () => true,
}));

jest.mock('@/store/useSettingsStore', () => ({
  useSettingsStore: () => ({ timeZone: 'Asia/Tokyo', setTimeZone: jest.fn() }),
}));

describe('iOS time zone screen', () => {
  test('uses the bottom native search and iOS list styling', async () => {
    const screen = await render(<TimeZoneScreen />);
    const rowClassName = screen.getByTestId('ios-time-zone-row-Asia/Tokyo').props.className;
    const separatorStyle = StyleSheet.flatten(
      screen.getByTestId('ios-time-zone-separator-Asia/Tokyo').props.style,
    );

    expect(screen.queryByText('time_zone.section')).toBeNull();
    expect(rowClassName).not.toContain('border');
    expect(separatorStyle).toMatchObject({ left: 16, right: 16 });
    expect(mockHeaderOptions?.headerShadowVisible).toBe(false);
    expect(mockSearchBar).toHaveBeenCalledWith(expect.objectContaining({
      allowToolbarIntegration: true,
      placement: 'integrated',
      placeholder: 'time_zone.search',
    }));
    expect(mockSearchBarSlot).toHaveBeenCalled();
    expect(mockSymbolView).toHaveBeenCalledWith(expect.objectContaining({
      name: 'checkmark',
      weight: 'semibold',
    }));
    await screen.unmount();
  });
});
