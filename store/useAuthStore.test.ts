import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';

import {
    ApiError,
    authApi,
    clearToken,
    getToken,
    setOnUnauthorized,
    setToken,
} from '../lib/api';
import {
    activateAuthSession,
    captureAuthSession,
    invalidateAuthSession,
} from '../lib/authSession';
import { cancelAllReminders } from '../lib/notifications';
import { useAuthStore } from './useAuthStore';

jest.mock('../lib/api', () => {
    class ApiError extends Error {
        status: number;

        constructor(message: string, status: number) {
            super(message);
            this.name = 'ApiError';
            this.status = status;
        }
    }

    return {
        ApiError,
        authApi: {
            login: jest.fn(),
            register: jest.fn(),
            me: jest.fn(),
        },
        setToken: jest.fn(),
        clearToken: jest.fn(),
        getToken: jest.fn(),
        setOnUnauthorized: jest.fn(),
    };
});

jest.mock('./useSettingsStore', () => {
    const mockState = {
        syncFromServer: jest.fn(),
        resetForLogout: jest.fn(),
    };
    return {
        useSettingsStore: { getState: () => mockState },
        mockState,
    };
});

jest.mock('./usePaymentMethodStore', () => {
    const mockState = {
        syncFromServer: jest.fn(),
        resetForLogout: jest.fn(),
    };
    return {
        usePaymentMethodStore: { getState: () => mockState },
        mockState,
    };
});

jest.mock('./usePaidyStore', () => {
    const mockState = {
        loadFromServer: jest.fn(),
        resetForLogout: jest.fn(),
    };
    return {
        usePaidyStore: { getState: () => mockState },
        mockState,
    };
});

jest.mock('./useSubscriptionStore', () => {
    const mockState = {
        resetForLogout: jest.fn(),
    };
    return {
        useSubscriptionStore: { getState: () => mockState },
        mockState,
    };
});

jest.mock('../lib/notifications', () => ({
    cancelAllReminders: jest.fn(),
}));

interface SettingsMock {
    syncFromServer: jest.Mock<() => Promise<void>>;
    resetForLogout: jest.Mock<() => Promise<void>>;
}

interface PaymentMethodMock {
    syncFromServer: jest.Mock<() => Promise<void>>;
    resetForLogout: jest.Mock<() => Promise<void>>;
}

interface PaidyMock {
    loadFromServer: jest.Mock<() => Promise<void>>;
    resetForLogout: jest.Mock<() => Promise<void>>;
}

interface SubscriptionMock {
    resetForLogout: jest.Mock<() => void>;
}

const settingsMock = (
    jest.requireMock('./useSettingsStore') as { mockState: SettingsMock }
).mockState;
const paymentMethodMock = (
    jest.requireMock('./usePaymentMethodStore') as { mockState: PaymentMethodMock }
).mockState;
const paidyMock = (
    jest.requireMock('./usePaidyStore') as { mockState: PaidyMock }
).mockState;
const subscriptionMock = (
    jest.requireMock('./useSubscriptionStore') as { mockState: SubscriptionMock }
).mockState;

const loginMock = jest.mocked(authApi.login);
const registerMock = jest.mocked(authApi.register);
const meMock = jest.mocked(authApi.me);
const setTokenMock = jest.mocked(setToken);
const clearTokenMock = jest.mocked(clearToken);
const getTokenMock = jest.mocked(getToken);
const cancelAllRemindersMock = jest.mocked(cancelAllReminders);
const unauthorizedHandler = jest.mocked(setOnUnauthorized).mock.calls[0][0];

function createUnsignedToken(subject: string): string {
    const payload = globalThis.btoa(JSON.stringify({ sub: subject }))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
    return `header.${payload}.signature`;
}

function resetAuthState(): void {
    useAuthStore.setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        isInitializing: true,
        error: null,
    });
}

describe('useAuthStore', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        invalidateAuthSession();
        resetAuthState();

        getTokenMock.mockResolvedValue(null);
        setTokenMock.mockResolvedValue();
        clearTokenMock.mockResolvedValue();
        settingsMock.syncFromServer.mockResolvedValue();
        settingsMock.resetForLogout.mockResolvedValue();
        paymentMethodMock.syncFromServer.mockResolvedValue();
        paymentMethodMock.resetForLogout.mockResolvedValue();
        paidyMock.loadFromServer.mockResolvedValue();
        paidyMock.resetForLogout.mockResolvedValue();
        cancelAllRemindersMock.mockResolvedValue();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('logs in, activates the session, and synchronizes user-scoped data', async () => {
        loginMock.mockResolvedValue({
            token: 'token-1',
            user: { id: 'user-1', username: 'alice' },
        });

        await useAuthStore.getState().login({
            username: 'alice',
            password: 'secret',
        });

        expect(setTokenMock).toHaveBeenCalledWith('token-1');
        expect(useAuthStore.getState()).toEqual(expect.objectContaining({
            user: { id: 'user-1', username: 'alice' },
            isAuthenticated: true,
            isLoading: false,
            error: null,
        }));
        expect(captureAuthSession()).toEqual(expect.objectContaining({
            userId: 'user-1',
        }));
        expect(settingsMock.syncFromServer).toHaveBeenCalledTimes(1);
        expect(paymentMethodMock.syncFromServer).toHaveBeenCalledTimes(1);
        expect(paidyMock.loadFromServer).toHaveBeenCalledTimes(1);
    });

    test('registers with a time zone and reports persistence failures', async () => {
        registerMock.mockResolvedValue({
            token: 'token-1',
            user: { id: 'user-1', username: 'alice' },
        });
        setTokenMock.mockRejectedValue(new Error('Storage unavailable'));

        await expect(useAuthStore.getState().register({
            username: 'alice',
            password: 'secret',
            time_zone: 'Asia/Tokyo',
        })).rejects.toThrow('Storage unavailable');

        expect(registerMock).toHaveBeenCalledWith({
            username: 'alice',
            password: 'secret',
            time_zone: 'Asia/Tokyo',
        });
        expect(useAuthStore.getState()).toEqual(expect.objectContaining({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: 'Storage unavailable',
        }));
        expect(captureAuthSession()).toBeNull();
    });

    test('logs out only after clearing credentials and user-scoped data', async () => {
        activateAuthSession('user-1');
        useAuthStore.setState({
            user: { id: 'user-1', username: 'alice' },
            isAuthenticated: true,
            isInitializing: false,
        });

        await useAuthStore.getState().logout();

        expect(clearTokenMock).toHaveBeenCalledTimes(1);
        expect(subscriptionMock.resetForLogout).toHaveBeenCalledTimes(1);
        expect(cancelAllRemindersMock).toHaveBeenCalledTimes(1);
        expect(settingsMock.resetForLogout).toHaveBeenCalledTimes(1);
        expect(paymentMethodMock.resetForLogout).toHaveBeenCalledTimes(1);
        expect(paidyMock.resetForLogout).toHaveBeenCalledTimes(1);
        expect(captureAuthSession()).toBeNull();
        expect(useAuthStore.getState()).toEqual(expect.objectContaining({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
        }));
    });

    test('does not present a successful logout when credential removal fails', async () => {
        activateAuthSession('user-1');
        useAuthStore.setState({
            user: { id: 'user-1', username: 'alice' },
            isAuthenticated: true,
            isInitializing: false,
        });
        clearTokenMock.mockRejectedValue(new Error('Storage unavailable'));

        await expect(useAuthStore.getState().logout())
            .rejects.toThrow('Storage unavailable');

        expect(subscriptionMock.resetForLogout).not.toHaveBeenCalled();
        expect(captureAuthSession()).toEqual(expect.objectContaining({
            userId: 'user-1',
        }));
        expect(useAuthStore.getState()).toEqual(expect.objectContaining({
            user: { id: 'user-1', username: 'alice' },
            isAuthenticated: true,
            isLoading: false,
            error: 'Storage unavailable',
        }));
    });

    test('clears user-scoped state when launching without a credential', async () => {
        getTokenMock.mockResolvedValue(null);

        await useAuthStore.getState().checkAuth();

        expect(meMock).not.toHaveBeenCalled();
        expect(subscriptionMock.resetForLogout).toHaveBeenCalledTimes(1);
        expect(useAuthStore.getState()).toEqual(expect.objectContaining({
            user: null,
            isAuthenticated: false,
            isInitializing: false,
        }));
    });

    test('restores a server-validated session and synchronizes user data', async () => {
        getTokenMock.mockResolvedValue('token-1');
        meMock.mockResolvedValue({ id: 'user-1', username: 'alice' });

        await useAuthStore.getState().checkAuth();

        expect(useAuthStore.getState()).toEqual(expect.objectContaining({
            user: { id: 'user-1', username: 'alice' },
            isAuthenticated: true,
            isInitializing: false,
        }));
        expect(captureAuthSession()).toEqual(expect.objectContaining({
            userId: 'user-1',
        }));
        expect(settingsMock.syncFromServer).toHaveBeenCalledTimes(1);
        expect(paymentMethodMock.syncFromServer).toHaveBeenCalledTimes(1);
        expect(paidyMock.loadFromServer).toHaveBeenCalledTimes(1);
    });

    test('keeps a stable valid credential during a transient offline launch', async () => {
        const token = createUnsignedToken('user-1');
        getTokenMock.mockResolvedValue(token);
        meMock.mockRejectedValue(new Error('Network unavailable'));

        await useAuthStore.getState().checkAuth();

        expect(clearTokenMock).not.toHaveBeenCalled();
        expect(useAuthStore.getState()).toEqual(expect.objectContaining({
            isAuthenticated: true,
            isInitializing: false,
            error: null,
        }));
        expect(captureAuthSession()).toEqual(expect.objectContaining({
            userId: 'user-1',
        }));
    });

    test('clears credentials and scoped state after a definitive rejection', async () => {
        getTokenMock.mockResolvedValue('rejected-token');
        meMock.mockRejectedValue(new ApiError('Unauthorized', 401));

        await useAuthStore.getState().checkAuth();

        expect(clearTokenMock).toHaveBeenCalledTimes(1);
        expect(subscriptionMock.resetForLogout).toHaveBeenCalledTimes(1);
        expect(captureAuthSession()).toBeNull();
        expect(useAuthStore.getState()).toEqual(expect.objectContaining({
            user: null,
            isAuthenticated: false,
            isInitializing: false,
        }));
    });

    test('logs out an authenticated user when the API rejects token refresh', () => {
        useAuthStore.setState({ isAuthenticated: true });
        const logoutMock = jest.spyOn(useAuthStore.getState(), 'logout')
            .mockResolvedValue();

        unauthorizedHandler?.();

        expect(logoutMock).toHaveBeenCalledTimes(1);
    });
});
