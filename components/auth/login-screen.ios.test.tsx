import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import { Alert } from 'react-native';

import LoginScreen from './login-screen.ios';

const mockReplace = jest.fn();
const mockPush = jest.fn();
const mockLogin = jest.fn<(payload: { username: string; password: string }) => Promise<void>>();
const mockClearError = jest.fn();

jest.mock('expo-router', () => ({
  Stack: { Screen: () => null },
  useRouter: () => ({ replace: mockReplace, push: mockPush }),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('@/hooks/use-color-scheme', () => ({
  useColorScheme: () => 'dark',
}));

jest.mock('@/store/useAuthStore', () => ({
  useAuthStore: () => ({
    login: (...args: [{ username: string; password: string }]) => mockLogin(...args),
    isLoading: false,
    clearError: mockClearError,
  }),
}));

describe('iOS login screen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
  });

  test('groups the fields into a single borderless card', async () => {
    const screen = await render(<LoginScreen />);
    const fieldsClassName = screen.getByTestId('ios-login-fields').props.className;
    const submitStyle = screen.getByTestId('ios-login-submit').props.style;

    expect(fieldsClassName).not.toContain(' border ');
    expect(submitStyle).toEqual(expect.objectContaining({ backgroundColor: '#0A84FF' }));
    await screen.unmount();
  });

  test('logs in and navigates to the tabs root', async () => {
    mockLogin.mockResolvedValue(undefined);
    const screen = await render(<LoginScreen />);

    await fireEvent.changeText(screen.getByTestId('ios-login-username'), 'alice');
    await fireEvent.changeText(screen.getByTestId('ios-login-password'), 'hunter2');
    await fireEvent.press(screen.getByTestId('ios-login-submit'));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({ username: 'alice', password: 'hunter2' });
      expect(mockReplace).toHaveBeenCalledWith('/(tabs)');
    });
    await screen.unmount();
  });

  test('requires both fields before submitting', async () => {
    const screen = await render(<LoginScreen />);
    await fireEvent.press(screen.getByTestId('ios-login-submit'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('common.input_error', 'login.error_required');
    });
    expect(mockLogin).not.toHaveBeenCalled();
    await screen.unmount();
  });
});
