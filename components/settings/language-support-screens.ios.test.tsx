import { describe, expect, jest, test } from '@jest/globals';
import { render } from '@testing-library/react-native';
import React from 'react';
import { StyleSheet } from 'react-native';

import LanguageScreen from './language-screen.ios';
import SupportScreen from './support-screen.ios';

let mockHeaderOptions: { headerShadowVisible?: boolean } | undefined;
const mockSymbolView = jest.fn((_props: unknown) => null);

jest.mock('expo-router', () => ({
  Stack: {
    Screen: ({ options }: { options: { headerShadowVisible?: boolean } }) => {
      mockHeaderOptions = options;
      return null;
    },
  },
  useRouter: () => ({
    back: jest.fn(),
    canGoBack: () => true,
    navigate: jest.fn(),
  }),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    i18n: { changeLanguage: jest.fn() },
    t: (key: string) => key,
  }),
}));

jest.mock('expo-symbols', () => ({
  SymbolView: (props: unknown) => mockSymbolView(props),
}));

jest.mock('@/hooks/use-color-scheme', () => ({
  useColorScheme: () => 'dark',
}));

jest.mock('@/store/useSettingsStore', () => ({
  useSettingsStore: () => ({ language: 'en', setLanguage: jest.fn() }),
}));

describe('iOS language and support screens', () => {
  test('removes the language list and header outer separators', async () => {
    const screen = await render(<LanguageScreen />);
    const className = screen.getByTestId('ios-language-list').props.className;
    const separatorStyle = StyleSheet.flatten(
      screen.getByTestId('ios-language-separator').props.style,
    );

    expect(className).not.toContain(' border ');
    expect(screen.queryByText('Select Language')).toBeNull();
    expect(separatorStyle).toMatchObject({ left: 16, right: 16 });
    expect(mockHeaderOptions?.headerShadowVisible).toBe(false);
    expect(mockSymbolView).toHaveBeenCalledWith(expect.objectContaining({
      name: 'checkmark',
      tintColor: '#3B82F6',
      weight: 'semibold',
    }));
    await screen.unmount();
  });

  test('removes support outer separators and uses SF Symbols', async () => {
    const screen = await render(<SupportScreen />);
    const className = screen.getByTestId('ios-support-list').props.className;
    const separatorStyle = StyleSheet.flatten(
      screen.getByTestId('ios-support-separator-faq').props.style,
    );

    expect(className).not.toContain(' border ');
    expect(separatorStyle).toMatchObject({ left: 60, right: 16 });
    expect(mockHeaderOptions?.headerShadowVisible).toBe(false);
    expect(mockSymbolView.mock.calls.map(([props]) => (
      props as { name: string }
    ).name)).toEqual(expect.arrayContaining([
      'questionmark.circle',
      'envelope',
      'ladybug',
      'chevron.right',
    ]));
    await screen.unmount();
  });
});
