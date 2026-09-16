import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import { Alert } from 'react-native';

import RegisterScreen from './register-screen.ios';

let mockHeaderOptions: { headerShown?: boolean; headerShadowVisible?: boolean; headerBackTitle?: string } | undefined;

const mockReplace = jest.fn();
const mockRegister = jest.fn<
  (payload: { username: string; password: string; time_zone: string }) => Promise<void>
>();
const mockClearError = jest.fn();

jest.mock('expo-router', () => ({
  Stack: {
    Screen: ({ options }: { options: { headerShown?: boolean; headerShadowVisible?: boolean; headerBackTitle?: string } }) => {
      mockHeaderOptions = options;
      return null;
    },
  },
  useRouter: () => ({ replace: mockReplace, back: jest.fn() }),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('@/hooks/use-color-scheme', () => ({
  useColorScheme: () => 'dark',
}));

jest.mock('@/lib/timeZone', () => ({
  getDeviceTimeZone: () => 'Asia/Tokyo',
}));

jest.mock('@/store/useAuthStore', () => ({
  useAuthStore: () => ({
    register: (
      ...args: [{ username: string; password: string; time_zone: string }]
    ) => mockRegister(...args),
    isLoading: false,
    clearError: mockClearError,
  }),
}));

describe('iOS register screen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
  });

  test('uses a native header with no shadow and groups fields into a borderless card', async () => {
    const screen = await render(<RegisterScreen />);
    const fieldsClassName = screen.getByTestId('ios-register-fields').props.className;

    expect(fieldsClassName).not.toContain(' border ');
    expect(mockHeaderOptions?.headerShown).toBe(true);
    expect(mockHeaderOptions?.headerShadowVisible).toBe(false);
    expect(mockHeaderOptions?.headerBackTitle).toBe(' ');
    await screen.unmount();
  });

  test('registers and navigates to the tabs root', async () => {
    mockRegister.mockResolvedValue(undefined);
    const screen = await render(<RegisterScreen />);

    await fireEvent.changeText(screen.getByTestId('ios-register-username'), 'alice.wonder');
    await fireEvent.changeText(screen.getByTestId('ios-register-password'), 'hunter22');
    await fireEvent.changeText(screen.getByTestId('ios-register-confirm-password'), 'hunter22');
    await fireEvent.press(screen.getByTestId('ios-register-submit'));

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith({
        username: 'alice.wonder',
        password: 'hunter22',
        time_zone: 'Asia/Tokyo',
      });
      expect(mockReplace).toHaveBeenCalledWith('/(tabs)');
    });
    await screen.unmount();
  });

  test('rejects a mismatched confirmation password', async () => {
    const screen = await render(<RegisterScreen />);

    await fireEvent.changeText(screen.getByTestId('ios-register-username'), 'alice.wonder');
    await fireEvent.changeText(screen.getByTestId('ios-register-password'), 'hunter22');
    await fireEvent.changeText(screen.getByTestId('ios-register-confirm-password'), 'different');
    await fireEvent.press(screen.getByTestId('ios-register-submit'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('common.input_error', 'register.error_mismatch');
    });
    expect(mockRegister).not.toHaveBeenCalled();
    await screen.unmount();
  });
});
