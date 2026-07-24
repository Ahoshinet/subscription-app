import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';
import * as SecureStore from 'expo-secure-store';

import {
    ApiError,
    authApi,
    paymentMethodApi,
    setOnUnauthorized,
    subscriptionApi,
    type CreateSubscriptionPayload,
    type Subscription,
} from './api';
import { invalidateAuthSession } from './authSession';
import { fetchWithTimeout } from './fetchWithTimeout';

jest.mock('expo-secure-store', () => ({
    getItemAsync: jest.fn(),
    setItemAsync: jest.fn(),
    deleteItemAsync: jest.fn(),
}));

jest.mock('expo-image-manipulator', () => ({
    ImageManipulator: {
        manipulate: jest.fn(),
    },
    SaveFormat: {
        JPEG: 'jpeg',
    },
}));

jest.mock('expo-file-system', () => ({
    File: class MockFile {},
}));

jest.mock('./fetchWithTimeout', () => ({
    fetchWithTimeout: jest.fn(),
}));

const getItemAsyncMock = jest.mocked(SecureStore.getItemAsync);
const setItemAsyncMock = jest.mocked(SecureStore.setItemAsync);
const fetchWithTimeoutMock = jest.mocked(fetchWithTimeout);

function response(status: number, body?: unknown): Response {
    const serialized = body === undefined ? '' : JSON.stringify(body);
    return {
        ok: status >= 200 && status < 300,
        status,
        json: jest.fn(async () => body),
        text: jest.fn(async () => serialized),
    } as unknown as Response;
}

const subscription: Subscription = {
    id: 42,
    user_id: 'user-1',
    service_name: 'Example',
    amount: 1200,
    currency: 'JPY',
    billing_cycle: 'monthly',
    payment_method: 'card',
    next_payment_date: '2026-08-24',
    status: 'active',
};

describe('api client', () => {
    beforeEach(() => {
        jest.spyOn(console, 'log').mockImplementation(() => {});
        invalidateAuthSession();
        getItemAsyncMock.mockReset();
        getItemAsyncMock.mockResolvedValue(null);
        setItemAsyncMock.mockReset();
        setItemAsyncMock.mockResolvedValue();
        fetchWithTimeoutMock.mockReset();
        setOnUnauthorized(null);
    });

    afterEach(() => {
        setOnUnauthorized(null);
        jest.restoreAllMocks();
    });

    test('sends login credentials without an authorization header', async () => {
        fetchWithTimeoutMock.mockResolvedValue(response(200, {
            token: 'token-1',
            user: { id: 'user-1', username: 'alice' },
        }));

        await expect(authApi.login({ username: 'alice', password: 'secret' }))
            .resolves.toEqual({
                token: 'token-1',
                user: { id: 'user-1', username: 'alice' },
            });

        const [url, init] = fetchWithTimeoutMock.mock.calls[0];
        expect(String(url)).toMatch(/\/api\/v1\/auth\/login$/);
        expect(init).toEqual(expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({ username: 'alice', password: 'secret' }),
            headers: {
                'Content-Type': 'application/json',
            },
        }));
    });

    test('adds the stored credential to authenticated requests', async () => {
        getItemAsyncMock.mockResolvedValue('token-1');
        fetchWithTimeoutMock.mockResolvedValue(response(200, {
            id: 'user-1',
            username: 'alice',
        }));

        await authApi.me();

        expect(fetchWithTimeoutMock).toHaveBeenCalledWith(
            expect.stringMatching(/\/api\/v1\/auth\/me$/),
            expect.objectContaining({
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: 'Bearer token-1',
                },
            }),
        );
    });

    test('preserves the subscription CRUD request contract', async () => {
        getItemAsyncMock.mockResolvedValue('token-1');
        const createPayload: CreateSubscriptionPayload = {
            service_name: 'Example',
            amount: 1200,
            currency: 'JPY',
            billing_cycle: 'monthly',
            payment_method: 'card',
            next_payment_date: '2026-08-24',
        };
        fetchWithTimeoutMock
            .mockResolvedValueOnce(response(200, [subscription]))
            .mockResolvedValueOnce(response(200, subscription))
            .mockResolvedValueOnce(response(200, {
                ...subscription,
                plan_name: null,
                memo: null,
            }))
            .mockResolvedValueOnce(response(200))
            .mockResolvedValueOnce(response(200, { message: 'deleted' }));

        await expect(subscriptionApi.getAll()).resolves.toEqual([subscription]);
        await expect(subscriptionApi.create(createPayload)).resolves.toEqual(subscription);
        await expect(subscriptionApi.update(42, {
            plan_name: null,
            memo: null,
        })).resolves.toEqual({
            ...subscription,
            plan_name: null,
            memo: null,
        });
        await expect(subscriptionApi.updateStatus(42, 'paused')).resolves.toEqual({});
        await expect(subscriptionApi.delete(42)).resolves.toEqual({ message: 'deleted' });

        expect(fetchWithTimeoutMock.mock.calls.map(([url, init]) => ({
            endpoint: String(url).match(/\/api\/v1(.*)$/)?.[1],
            method: init?.method,
            body: init?.body,
        }))).toEqual([
            { endpoint: '/subscriptions/list', method: undefined, body: undefined },
            {
                endpoint: '/subscriptions',
                method: 'POST',
                body: JSON.stringify(createPayload),
            },
            {
                endpoint: '/subscriptions/42',
                method: 'PUT',
                body: JSON.stringify({ plan_name: null, memo: null }),
            },
            {
                endpoint: '/subscriptions/42/status',
                method: 'PATCH',
                body: JSON.stringify({ status: 'paused' }),
            },
            { endpoint: '/subscriptions/42', method: 'DELETE', body: undefined },
        ]);
    });

    test('preserves the payment-method CRUD request contract', async () => {
        getItemAsyncMock.mockResolvedValue('token-1');
        const method = {
            id: 'method-1',
            user_id: 'user-1',
            type: 'credit_card',
            label: 'Main card',
            color: '#3B82F6',
            last4: '4242',
        };
        fetchWithTimeoutMock
            .mockResolvedValueOnce(response(200, [method]))
            .mockResolvedValueOnce(response(200, method))
            .mockResolvedValueOnce(response(200))
            .mockResolvedValueOnce(response(200));

        await expect(paymentMethodApi.getAll()).resolves.toEqual([method]);
        await expect(paymentMethodApi.create({
            type: 'credit_card',
            label: 'Main card',
            color: '#3B82F6',
            last4: '4242',
        })).resolves.toEqual(method);
        await expect(paymentMethodApi.update('method-1', {
            last4: null,
            memo: null,
        })).resolves.toEqual({});
        await expect(paymentMethodApi.delete('method-1')).resolves.toEqual({});

        expect(fetchWithTimeoutMock.mock.calls.map(([url, init]) => ({
            endpoint: String(url).match(/\/api\/v1(.*)$/)?.[1],
            method: init?.method,
            body: init?.body,
        }))).toEqual([
            { endpoint: '/payment-methods', method: undefined, body: undefined },
            {
                endpoint: '/payment-methods',
                method: 'POST',
                body: JSON.stringify({
                    type: 'credit_card',
                    label: 'Main card',
                    color: '#3B82F6',
                    last4: '4242',
                }),
            },
            {
                endpoint: '/payment-methods/method-1',
                method: 'PUT',
                body: JSON.stringify({ last4: null, memo: null }),
            },
            {
                endpoint: '/payment-methods/method-1',
                method: 'DELETE',
                body: undefined,
            },
        ]);
    });

    test('reports response errors with their status and server message', async () => {
        fetchWithTimeoutMock.mockResolvedValue(response(422, {
            error: 'Invalid subscription',
        }));

        await expect(subscriptionApi.create({
            service_name: '',
            amount: 0,
            next_payment_date: '2026-08-24',
        })).rejects.toEqual(new ApiError('Invalid subscription', 422));
    });

    test('refreshes once and retries the original request with the new credential', async () => {
        getItemAsyncMock
            .mockResolvedValueOnce('old-token')
            .mockResolvedValueOnce('old-token')
            .mockResolvedValueOnce('new-token')
            .mockResolvedValueOnce('new-token');
        fetchWithTimeoutMock
            .mockResolvedValueOnce(response(401, { error: 'expired' }))
            .mockResolvedValueOnce(response(200, { token: 'new-token' }))
            .mockResolvedValueOnce(response(200, [subscription]));

        await expect(subscriptionApi.getAll()).resolves.toEqual([subscription]);

        expect(setItemAsyncMock).toHaveBeenCalledWith('auth_token', 'new-token');
        expect(fetchWithTimeoutMock).toHaveBeenCalledTimes(3);
        expect(fetchWithTimeoutMock.mock.calls[1][0])
            .toEqual(expect.stringMatching(/\/api\/v1\/auth\/refresh$/));
        expect(fetchWithTimeoutMock.mock.calls[2][1]).toEqual(expect.objectContaining({
            headers: expect.objectContaining({
                Authorization: 'Bearer new-token',
            }),
        }));
    });

    test('notifies the App when refresh definitively rejects the credential', async () => {
        const unauthorized = jest.fn();
        setOnUnauthorized(unauthorized);
        getItemAsyncMock.mockResolvedValue('old-token');
        fetchWithTimeoutMock
            .mockResolvedValueOnce(response(401, { error: 'expired' }))
            .mockResolvedValueOnce(response(401, { error: 'expired' }));

        await expect(subscriptionApi.getAll())
            .rejects.toEqual(new ApiError('expired', 401));
        expect(unauthorized).toHaveBeenCalledTimes(1);
    });
});
