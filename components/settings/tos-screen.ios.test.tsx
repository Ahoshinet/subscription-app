import { describe, expect, jest, test } from '@jest/globals';
import { render } from '@testing-library/react-native';
import React from 'react';
import { StyleSheet } from 'react-native';

import TosScreen from './tos-screen.ios';

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

describe('iOS terms screen', () => {
  test('keeps legal headings while removing duplicate title and outer borders', async () => {
    const screen = await render(<TosScreen />);
    const cardClassName = screen.getByTestId('ios-tos-card').props.className;
    const separatorStyle = StyleSheet.flatten(
      screen.getByTestId('ios-tos-separator-0').props.style,
    );

    expect(screen.queryByText('tos.title')).toBeNull();
    expect(screen.getByText('tos.effective_date')).toBeTruthy();
    expect(screen.getByText('tos.s1_title')).toBeTruthy();
    expect(cardClassName).not.toContain('border');
    expect(separatorStyle).toMatchObject({ left: 16, right: 16 });
    expect(mockHeaderOptions?.headerShadowVisible).toBe(false);
    await screen.unmount();
  });
});
