import { describe, expect, jest, test } from '@jest/globals';
import { render } from '@testing-library/react-native';
import React from 'react';
import { StyleSheet } from 'react-native';

import AboutScreen from './about-screen.ios';

let mockHeaderOptions: { headerShadowVisible?: boolean } | undefined;
const mockSymbolView = jest.fn((_props: unknown) => null);

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    expoConfig: {
      orientation: 'portrait',
      scheme: 'subscriptionapp',
    },
  },
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
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('@/hooks/use-color-scheme', () => ({
  useColorScheme: () => 'dark',
}));

jest.mock('@/lib/api', () => ({
  isUsingPublicApi: () => true,
  versionApi: { getServerVersion: () => new Promise(() => {}) },
}));

jest.mock('@/lib/versionCheck', () => ({
  getCurrentAppVersion: () => '2.0.0-beta10',
}));

jest.mock('@/store/useSettingsStore', () => ({
  useSettingsStore: () => ({ language: 'en', theme: 'dark' }),
}));

describe('iOS about screen', () => {
  test('matches the grouped General layout with SF Symbols', async () => {
    const screen = await render(<AboutScreen />);
    const surfaceIds = [
      'ios-about-hero-card',
      'ios-about-app-card',
      'ios-about-environment-card',
      'ios-about-creator-card',
      'ios-about-credits-card',
    ];
    const separatorStyle = StyleSheet.flatten(
      screen.getByTestId('ios-about-separator-app-name').props.style,
    );
    const heroStyle = StyleSheet.flatten(
      screen.getByTestId('ios-about-hero-card').props.style,
    );

    for (const id of surfaceIds) {
      expect(screen.getByTestId(id).props.className).not.toContain('border');
    }
    expect(screen.queryByText('about.section_app')).toBeNull();
    expect(screen.queryByText('about.section_device')).toBeNull();
    expect(screen.queryByText('about.section_credits')).toBeNull();
    expect(heroStyle).toMatchObject({ alignItems: 'flex-start' });
    expect(separatorStyle).toMatchObject({ left: 60, right: 16 });
    expect(mockHeaderOptions?.headerShadowVisible).toBe(false);
    expect(mockSymbolView.mock.calls.map(([props]) => (
      props as { name: string }
    ).name)).toEqual(expect.arrayContaining([
      'sparkles',
      'tag',
      'link',
      'iphone',
      'cloud',
      'cpu',
      'rectangle.dashed',
      'character',
      'moon',
      'person.2',
      'doc.text',
      'chevron.left.forwardslash.chevron.right',
      'ladybug',
      'arrow.up.right.square',
    ]));
    await screen.unmount();
  });
});
