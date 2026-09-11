import { describe, expect, jest, test } from '@jest/globals';
import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import SettingsScreen from './settings-screen.ios';

const mockPush = jest.fn();
const mockSetTheme = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn() }),
  useScrollToTop: jest.fn(),
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: () => null,
}));

jest.mock('expo-symbols', () => ({
  SymbolView: () => null,
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('@/hooks/use-color-scheme', () => ({
  useColorScheme: () => 'dark',
}));

jest.mock('@/store/useAuthStore', () => ({
  useAuthStore: () => ({ logout: jest.fn(), user: { username: 'Test User' } }),
}));

jest.mock('@/store/usePaidyStore', () => ({
  usePaidyStore: () => ({ isSignedIn: false }),
}));

jest.mock('@/store/useSettingsStore', () => ({
  useSettingsStore: () => ({
    clearSyncError: jest.fn(),
    language: 'en',
    pushNotifications: true,
    setPushNotifications: jest.fn(),
    setTheme: mockSetTheme,
    syncError: null,
    timeZone: 'Asia/Tokyo',
  }),
}));

describe('iOS settings screen', () => {
  test('uses the iOS dark grouped background and keeps navigation functional', async () => {
    const screen = await render(<SettingsScreen />);

    expect(screen.getByTestId('ios-settings-screen')).toHaveStyle({
      backgroundColor: '#000000',
    });
    expect(screen.queryByText('settings.account')).toBeNull();
    expect(screen.queryByText('settings.preferences')).toBeNull();
    expect(screen.queryByText('gmail.section_title')).toBeNull();
    expect(screen.queryByText('settings.app_info')).toBeNull();

    const profileRow = screen.getByRole('button', { name: 'settings.profile' });
    expect(profileRow).toHaveStyle({
      alignItems: 'center',
      flexDirection: 'row',
      minHeight: 50,
      paddingHorizontal: 16,
    });

    fireEvent.press(profileRow);
    expect(mockPush).toHaveBeenCalledWith('/settings/profile');
  });

  test('changes the theme through the native switch', async () => {
    const screen = await render(<SettingsScreen />);

    fireEvent(
      screen.getByRole('switch', { name: 'settings.dark_mode' }),
      'valueChange',
      false,
    );

    expect(mockSetTheme).toHaveBeenCalledWith('light');
  });
});
