import { describe, expect, jest, test } from '@jest/globals';
import { render } from '@testing-library/react-native';
import React from 'react';
import { StyleSheet } from 'react-native';

import GmailScreen from './gmail-screen.ios';

let mockHeaderOptions: { headerShadowVisible?: boolean } | undefined;
const mockSymbolView = jest.fn((_props: unknown) => null);

jest.mock('expo-auth-session/providers/google', () => ({
  useAuthRequest: () => [{}, null, jest.fn()],
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: () => null,
}));

jest.mock('expo-router', () => ({
  Stack: {
    Screen: ({ options }: { options: { headerShadowVisible?: boolean } }) => {
      mockHeaderOptions = options;
      return null;
    },
  },
}));

jest.mock('expo-symbols', () => ({
  SymbolView: (props: unknown) => mockSymbolView(props),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

jest.mock('@/hooks/use-color-scheme', () => ({
  useColorScheme: () => 'dark',
}));

jest.mock('@/store/usePaidyStore', () => ({
  usePaidyStore: () => ({
    clearError: jest.fn(),
    error: null,
    googleEmail: 'test@example.com',
    isLoading: false,
    isSignedIn: true,
    lastSyncedAt: null,
    needsReauth: true,
    paidyAmount: null,
    paidyMonth: null,
    setSignedIn: jest.fn(),
    signOut: jest.fn(),
    syncPaidy: jest.fn(),
  }),
}));

describe('iOS Gmail settings screen', () => {
  test('removes outer borders and headings and uses SF Symbols', async () => {
    const screen = await render(<GmailScreen />);
    const surfaceIds = [
      'ios-gmail-connected-card',
      'ios-gmail-reauth-card',
      'ios-gmail-reauth-button',
      'ios-gmail-sync-button',
      'ios-gmail-signout-button',
      'ios-gmail-about-card',
      'ios-gmail-beta-card',
    ];
    const separatorStyle = StyleSheet.flatten(
      screen.getByTestId('ios-gmail-connected-separator').props.style,
    );

    for (const id of surfaceIds) {
      expect(screen.getByTestId(id).props.className).not.toContain('border');
    }
    expect(screen.queryByText('gmail.about_title')).toBeNull();
    expect(screen.queryByText('gmail.about_tester_title')).toBeNull();
    expect(separatorStyle).toMatchObject({ left: 16, right: 16 });
    expect(mockHeaderOptions?.headerShadowVisible).toBe(false);
    expect(mockSymbolView.mock.calls.map(([props]) => (
      props as { name: string }
    ).name)).toEqual(expect.arrayContaining([
      'checkmark',
      'exclamationmark.triangle',
      'arrow.clockwise',
      'checkmark.shield',
      'arrow.up.right.square',
      'envelope',
    ]));
    await screen.unmount();
  });
});
