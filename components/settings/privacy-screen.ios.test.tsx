import { describe, expect, jest, test } from '@jest/globals';
import { render } from '@testing-library/react-native';
import React from 'react';
import { StyleSheet } from 'react-native';

import PrivacyScreen from './privacy-screen.ios';

let mockHeaderOptions: { headerShadowVisible?: boolean } | undefined;

jest.mock('expo-router', () => ({
  Stack: {
    Screen: ({ options }: { options: { headerShadowVisible?: boolean } }) => {
      mockHeaderOptions = options;
      return null;
    },
  },
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('@/hooks/use-color-scheme', () => ({
  useColorScheme: () => 'dark',
}));

describe('iOS privacy screen', () => {
  test('matches the iOS terms document styling', async () => {
    const screen = await render(<PrivacyScreen />);
    const cardClassName = screen.getByTestId('ios-privacy-card').props.className;
    const separatorStyle = StyleSheet.flatten(
      screen.getByTestId('ios-privacy-separator-0').props.style,
    );

    expect(screen.queryByText('privacy.title')).toBeNull();
    expect(screen.getByText('privacy.effective_date')).toBeTruthy();
    expect(screen.getByText('privacy.s1_title')).toBeTruthy();
    expect(cardClassName).not.toContain('border');
    expect(separatorStyle).toMatchObject({ left: 16, right: 16 });
    expect(mockHeaderOptions?.headerShadowVisible).toBe(false);
    await screen.unmount();
  });
});
