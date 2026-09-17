import { describe, expect, jest, test } from '@jest/globals';
import { render } from '@testing-library/react-native';
import React from 'react';

import PasswordScreen from './password-screen.ios';

let mockHeaderOptions: { headerShadowVisible?: boolean } | undefined;

jest.mock('expo-router', () => ({
  Stack: {
    Screen: ({ options }: { options: { headerShadowVisible?: boolean } }) => {
      mockHeaderOptions = options;
      return null;
    },
  },
  useRouter: () => ({ back: jest.fn() }),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('@/hooks/use-color-scheme', () => ({
  useColorScheme: () => 'dark',
}));

jest.mock('@/lib/api', () => ({
  authApi: { changePassword: jest.fn() },
}));

describe('iOS password screen', () => {
  test('removes outer borders and the header separator', async () => {
    const screen = await render(<PasswordScreen />);
    const fieldsClassName = screen.getByTestId('ios-password-fields').props.className;
    const buttonClassName = screen.getByTestId('ios-password-update').props.className;

    expect(fieldsClassName).not.toContain(' border ');
    expect(buttonClassName).not.toContain(' border ');
    expect(mockHeaderOptions?.headerShadowVisible).toBe(false);
  });
});
