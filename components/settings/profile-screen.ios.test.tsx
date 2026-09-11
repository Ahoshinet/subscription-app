import { describe, expect, jest, test } from '@jest/globals';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';

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

describe('iOS profile name editor', () => {
  test('opens focused without a save button', async () => {
    const screen = await render(<ProfileScreen />);
    const input = screen.getByDisplayValue('old.name');

    expect(input.props.autoFocus).toBe(true);
    expect(input.props.clearButtonMode).toBe('while-editing');
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
});
