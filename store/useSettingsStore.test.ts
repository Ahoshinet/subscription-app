import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { settingsApi, type UserSettings } from '../lib/api';
import { activateAuthSession, invalidateAuthSession } from '../lib/authSession';
import { useSettingsStore } from './useSettingsStore';

jest.mock('@react-native-async-storage/async-storage', () => ({
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
}));

jest.mock('../lib/api', () => ({
    settingsApi: {
        get: jest.fn(),
        update: jest.fn(),
    },
}));

const getSettingsMock = jest.mocked(settingsApi.get);
const updateSettingsMock = jest.mocked(settingsApi.update);
const removeItemMock = jest.mocked(AsyncStorage.removeItem);

const serverSettings: UserSettings = {
    user_id: 'user-1',
    language: 'ja',
    currency: 'USD',
    push_notifications: false,
    theme: 'dark',
    time_zone: 'America/New_York',
};

describe('useSettingsStore', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        invalidateAuthSession();
        useSettingsStore.setState({
            language: 'en',
            currency: 'JPY',
            pushNotifications: true,
            theme: 'system',
            timeZone: 'Asia/Tokyo',
            isSyncing: false,
            syncError: false,
        });

        getSettingsMock.mockResolvedValue(serverSettings);
        updateSettingsMock.mockResolvedValue(serverSettings);
        removeItemMock.mockResolvedValue();
    });

    test('does not synchronize without an active authentication session', async () => {
        await useSettingsStore.getState().syncFromServer();
        await useSettingsStore.getState().syncToServer({ language: 'ja' });

        expect(getSettingsMock).not.toHaveBeenCalled();
        expect(updateSettingsMock).not.toHaveBeenCalled();
    });

    test('maps valid server settings for the current session', async () => {
        activateAuthSession('user-1');

        await useSettingsStore.getState().syncFromServer();

        expect(useSettingsStore.getState()).toEqual(expect.objectContaining({
            language: 'ja',
            currency: 'USD',
            pushNotifications: false,
            theme: 'dark',
            timeZone: 'America/New_York',
            isSyncing: false,
            syncError: false,
        }));
    });

    test('falls back when the server returns unsupported enum values', async () => {
        activateAuthSession('user-1');
        getSettingsMock.mockResolvedValue({
            ...serverSettings,
            language: 'unsupported',
            currency: 'BTC',
            theme: 'neon',
            time_zone: '',
        });

        await useSettingsStore.getState().syncFromServer();

        expect(useSettingsStore.getState()).toEqual(expect.objectContaining({
            language: 'en',
            theme: 'system',
        }));
        expect(useSettingsStore.getState().currency).not.toBe('BTC');
        expect(useSettingsStore.getState().timeZone).not.toBe('');
    });

    test('does not apply a response after the authenticated user changes', async () => {
        let resolveRequest: (settings: UserSettings) => void = () => {};
        getSettingsMock.mockReturnValue(new Promise((resolve) => {
            resolveRequest = resolve;
        }));
        activateAuthSession('user-1');

        const sync = useSettingsStore.getState().syncFromServer();
        activateAuthSession('user-2');
        resolveRequest(serverSettings);
        await sync;

        expect(useSettingsStore.getState()).toEqual(expect.objectContaining({
            language: 'en',
            currency: 'JPY',
            theme: 'system',
            timeZone: 'Asia/Tokyo',
        }));
    });

    test('records a current-session fetch failure', async () => {
        activateAuthSession('user-1');
        getSettingsMock.mockRejectedValue(new Error('Offline'));

        await useSettingsStore.getState().syncFromServer();

        expect(useSettingsStore.getState()).toEqual(expect.objectContaining({
            isSyncing: false,
            syncError: true,
        }));
    });

    test('sends settings patches and clears the syncing flag', async () => {
        activateAuthSession('user-1');

        await useSettingsStore.getState().syncToServer({
            push_notifications: false,
            time_zone: 'UTC',
        });

        expect(updateSettingsMock).toHaveBeenCalledWith({
            push_notifications: false,
            time_zone: 'UTC',
        });
        expect(useSettingsStore.getState()).toEqual(expect.objectContaining({
            isSyncing: false,
            syncError: false,
        }));
    });

    test('records update failures without rejecting the local setter flow', async () => {
        activateAuthSession('user-1');
        updateSettingsMock.mockRejectedValue(new Error('Offline'));

        await expect(useSettingsStore.getState().syncToServer({
            theme: 'dark',
        })).resolves.toBeUndefined();

        expect(useSettingsStore.getState()).toEqual(expect.objectContaining({
            isSyncing: false,
            syncError: true,
        }));
    });

    test('clears persisted settings on logout', async () => {
        useSettingsStore.setState({
            language: 'ja',
            currency: 'USD',
            pushNotifications: false,
            theme: 'dark',
            timeZone: 'America/New_York',
            isSyncing: true,
            syncError: true,
        });

        await useSettingsStore.getState().resetForLogout();

        expect(removeItemMock).toHaveBeenCalledWith('settings-storage');
        expect(useSettingsStore.getState()).toEqual(expect.objectContaining({
            language: 'en',
            pushNotifications: true,
            theme: 'system',
            isSyncing: false,
            syncError: false,
        }));
    });
});
