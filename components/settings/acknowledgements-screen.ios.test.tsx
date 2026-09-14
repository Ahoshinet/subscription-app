import { describe, expect, jest, test } from '@jest/globals';
import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';
import { Linking, StyleSheet } from 'react-native';

import AcknowledgementsScreen from './acknowledgements-screen.ios';

let mockHeaderOptions: { headerShadowVisible?: boolean } | undefined;
const mockSymbolView = jest.fn((_props: unknown) => null);

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

jest.mock('@/constants/licenses', () => ({
  THIRD_PARTY_LICENSES: [
    { name: 'expo', version: '57.0.9', license: 'MIT', repository: 'https://github.com/expo/expo' },
    { name: 'zustand', version: '5.0.14', license: 'MIT', repository: null },
  ],
  THIRD_PARTY_LICENSES_URL: 'https://example.com/THIRD_PARTY_LICENSES.md',
}));

describe('iOS acknowledgements screen', () => {
  test('lists bundled libraries and links out to the full license texts', async () => {
    const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
    const screen = await render(<AcknowledgementsScreen />);

    for (const id of [
      'ios-acknowledgements-intro-card',
      'ios-acknowledgements-libraries-card',
      'ios-acknowledgements-licenses-card',
    ]) {
      expect(screen.getByTestId(id).props.className).not.toContain('border');
    }
    expect(screen.getByText('acknowledgements.intro_body')).toBeTruthy();
    expect(screen.getByText('v57.0.9 · MIT')).toBeTruthy();
    expect(screen.getByText('v5.0.14 · MIT')).toBeTruthy();
    expect(
      StyleSheet.flatten(screen.getByTestId('ios-acknowledgements-separator-first').props.style),
    ).toMatchObject({ left: 16, right: 16 });
    expect(mockHeaderOptions?.headerShadowVisible).toBe(false);
    expect(screen.queryByText('acknowledgements.section_libraries')).toBeNull();

    // One trailing icon per linkable library, plus the full-license link.
    expect(mockSymbolView.mock.calls.map(([props]) => (props as { name: string }).name))
      .toEqual(['chevron.right', 'chevron.right']);

    await fireEvent.press(screen.getByText('expo'));
    expect(openURL).toHaveBeenCalledWith('https://github.com/expo/expo');

    await fireEvent.press(screen.getByText('zustand'));
    expect(openURL).toHaveBeenCalledTimes(1);

    await fireEvent.press(screen.getByText('acknowledgements.full_licenses'));
    expect(openURL).toHaveBeenLastCalledWith('https://example.com/THIRD_PARTY_LICENSES.md');

    openURL.mockRestore();
    await screen.unmount();
  });
});
