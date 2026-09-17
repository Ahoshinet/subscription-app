import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import { Alert } from 'react-native';

import ProfileScreen from './profile-screen.ios';

interface BeforeRemoveEvent {
  data: { action: { type: string } };
  preventDefault: jest.Mock;
}

let mockBeforeRemoveListener: ((event: BeforeRemoveEvent) => void) | undefined;
const mockDispatch = jest.fn();
const mockSetAuthState = jest.fn();
const mockUpdateProfile = jest.fn<
  (data: { username: string }) => Promise<{ id: string; username: string }>
>();

jest.mock('expo-router', () => ({
  Stack: { Screen: () => null },
  useNavigation: () => ({
    addListener: (_name: string, listener: (event: BeforeRemoveEvent) => void) => {
      mockBeforeRemoveListener = listener;
      return jest.fn();
    },
    dispatch: (...args: unknown[]) => mockDispatch(...args),
  }),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('expo-symbols', () => ({
  SymbolView: () => null,
}));

jest.mock('@/hooks/use-color-scheme', () => ({
  useColorScheme: () => 'dark',
}));

jest.mock('@/lib/api', () => ({
  authApi: {
    updateProfile: (...args: [{ username: string }]) => mockUpdateProfile(...args),
  },
}));

jest.mock('@/store/useAuthStore', () => {
  const useAuthStore = () => ({ user: { id: 'user-1', username: 'old.name' } });
  useAuthStore.setState = (...args: unknown[]) => mockSetAuthState(...args);
  return { useAuthStore };
});

type AlertButton = { text?: string; onPress?: () => void };

function pressAlertButton(text: string) {
  const buttons = jest.mocked(Alert.alert).mock.calls.at(-1)?.[2] as AlertButton[] | undefined;
  const button = buttons?.find((candidate) => candidate.text === text);
  if (!button) throw new Error(`Alert button ${text} not found`);
  button.onPress?.();
}

describe('iOS profile name editor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
  });

  test('opens focused without a save button', async () => {
    const screen = await render(<ProfileScreen />);
    const input = screen.getByDisplayValue('old.name');

    expect(input.props.autoFocus).toBe(true);
    expect(screen.getByRole('button', { name: 'profile.clear_name' })).toHaveStyle({
      right: 12,
      width: 36,
    });
    expect(screen.queryByText('profile.save')).toBeNull();
    await screen.unmount();
  });

  test('saves a changed name before completing back navigation', async () => {
    mockUpdateProfile.mockResolvedValue({ id: 'user-1', username: 'new.name' });
    const screen = await render(<ProfileScreen />);
    await fireEvent.changeText(screen.getByDisplayValue('old.name'), ' new.name ');

    const action = { type: 'GO_BACK' };
    const event: BeforeRemoveEvent = { data: { action }, preventDefault: jest.fn() };
    await act(async () => {
      mockBeforeRemoveListener?.(event);
    });

    expect(event.preventDefault).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(mockUpdateProfile).toHaveBeenCalledWith({ username: 'new.name' });
      expect(mockSetAuthState).toHaveBeenCalledWith({
        user: { id: 'user-1', username: 'new.name' },
      });
      expect(mockDispatch).toHaveBeenCalledWith(action);
    });
    await screen.unmount();
  });

  test('offers to discard when saving fails so the user can still leave', async () => {
    mockUpdateProfile.mockRejectedValue(new Error('offline'));
    const screen = await render(<ProfileScreen />);
    await fireEvent.changeText(screen.getByDisplayValue('old.name'), 'new.name');

    const action = { type: 'GO_BACK' };
    const event: BeforeRemoveEvent = { data: { action }, preventDefault: jest.fn() };
    await act(async () => {
      mockBeforeRemoveListener?.(event);
    });

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'common.error',
        expect.any(String),
        expect.arrayContaining([
          expect.objectContaining({ text: 'profile.discard_keep' }),
          expect.objectContaining({ text: 'profile.discard_confirm' }),
        ]),
      );
    });
    expect(mockDispatch).not.toHaveBeenCalled();

    await act(async () => {
      pressAlertButton('profile.discard_confirm');
    });
    expect(mockDispatch).toHaveBeenCalledWith(action);
    expect(mockSetAuthState).not.toHaveBeenCalled();
    await screen.unmount();
  });

  test('keeps the user editing when an empty name is kept', async () => {
    const screen = await render(<ProfileScreen />);
    await fireEvent.changeText(screen.getByDisplayValue('old.name'), '   ');

    const action = { type: 'GO_BACK' };
    const event: BeforeRemoveEvent = { data: { action }, preventDefault: jest.fn() };
    await act(async () => {
      mockBeforeRemoveListener?.(event);
    });

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'common.error',
        'profile.name_required',
        expect.any(Array),
      );
    });
    expect(mockUpdateProfile).not.toHaveBeenCalled();

    await act(async () => {
      pressAlertButton('profile.discard_keep');
    });
    expect(mockDispatch).not.toHaveBeenCalled();

    // A second back attempt must not be swallowed by the pending guard.
    const retry: BeforeRemoveEvent = { data: { action }, preventDefault: jest.fn() };
    await act(async () => {
      mockBeforeRemoveListener?.(retry);
    });
    expect(retry.preventDefault).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledTimes(2);
    });
    await screen.unmount();
  });
});
