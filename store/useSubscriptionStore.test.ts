import { beforeEach, describe, expect, jest, test } from '@jest/globals';

jest.mock('../lib/api', () => ({
    subscriptionApi: {
        getAll: jest.fn(),
        renew: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    },
}));

import {
    subscriptionApi,
    type CreateSubscriptionPayload,
    type Subscription,
} from '../lib/api';
import { activateAuthSession, invalidateAuthSession } from '../lib/authSession';
import { useSubscriptionStore } from './useSubscriptionStore';

const getAllMock = jest.mocked(subscriptionApi.getAll);
const renewMock = jest.mocked(subscriptionApi.renew);
const createMock = jest.mocked(subscriptionApi.create);
const updateMock = jest.mocked(subscriptionApi.update);
const deleteMock = jest.mocked(subscriptionApi.delete);

const serverSubscription: Subscription = {
    id: 42,
    user_id: 'user-1',
    service_name: 'Example',
    plan_name: 'Standard',
    amount: 1200,
    currency: 'JPY',
    billing_cycle: 'monthly',
    payment_method: 'credit_card',
    payment_details: '4242',
    memo: 'Primary',
    next_payment_date: '2026-08-01',
    status: 'active',
};

const createPayload: CreateSubscriptionPayload = {
    service_name: 'Example',
    plan_name: 'Standard',
    amount: 1200,
    currency: 'JPY',
    billing_cycle: 'monthly',
    payment_method: 'credit_card',
    payment_details: '4242',
    memo: 'Primary',
    next_payment_date: '2026-08-01',
    status: 'active',
};

describe('useSubscriptionStore', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        invalidateAuthSession();
        useSubscriptionStore.setState({
            subscriptions: [],
            isLoading: false,
            error: null,
        });

        renewMock.mockResolvedValue({
            updated: 0,
            subscriptions: [serverSubscription],
        });
        getAllMock.mockResolvedValue([serverSubscription]);
        createMock.mockResolvedValue(serverSubscription);
        updateMock.mockResolvedValue(serverSubscription);
        deleteMock.mockResolvedValue({ message: 'deleted' });
    });

    test('does not fetch without an active authentication session', async () => {
        await useSubscriptionStore.getState().fetchSubscriptions();

        expect(renewMock).not.toHaveBeenCalled();
        expect(getAllMock).not.toHaveBeenCalled();
    });

    test('loads the renewed subscription list for the current session', async () => {
        activateAuthSession('user-1');

        await useSubscriptionStore.getState().fetchSubscriptions();

        expect(renewMock).toHaveBeenCalledTimes(1);
        expect(getAllMock).not.toHaveBeenCalled();
        expect(useSubscriptionStore.getState()).toEqual(expect.objectContaining({
            subscriptions: [serverSubscription],
            isLoading: false,
            error: null,
        }));
    });

    test('falls back to a plain list when renewal fails', async () => {
        activateAuthSession('user-1');
        renewMock.mockRejectedValue(new Error('Renew unavailable'));

        await useSubscriptionStore.getState().fetchSubscriptions();

        expect(getAllMock).toHaveBeenCalledTimes(1);
        expect(useSubscriptionStore.getState()).toEqual(expect.objectContaining({
            subscriptions: [serverSubscription],
            isLoading: false,
            error: null,
        }));
    });

    test('records a fetch error only after renewal and fallback both fail', async () => {
        activateAuthSession('user-1');
        renewMock.mockRejectedValue(new Error('Renew unavailable'));
        getAllMock.mockRejectedValue(new Error('Offline'));

        await useSubscriptionStore.getState().fetchSubscriptions();

        expect(useSubscriptionStore.getState()).toEqual(expect.objectContaining({
            subscriptions: [],
            isLoading: false,
            error: 'Offline',
        }));
    });

    test('does not apply a fetch response after the authenticated user changes', async () => {
        let resolveRequest: (
            value: { updated: number; subscriptions: Subscription[] },
        ) => void = () => {};
        renewMock.mockReturnValue(new Promise((resolve) => {
            resolveRequest = resolve;
        }));
        activateAuthSession('user-1');

        const fetchRequest = useSubscriptionStore.getState().fetchSubscriptions();
        activateAuthSession('user-2');
        resolveRequest({ updated: 0, subscriptions: [serverSubscription] });
        await fetchRequest;

        expect(useSubscriptionStore.getState().subscriptions).toEqual([]);
    });

    test('appends a successfully created subscription', async () => {
        activateAuthSession('user-1');

        await useSubscriptionStore.getState().addSubscription(createPayload);

        expect(createMock).toHaveBeenCalledWith(createPayload);
        expect(useSubscriptionStore.getState()).toEqual(expect.objectContaining({
            subscriptions: [serverSubscription],
            isLoading: false,
            error: null,
        }));
    });

    test('merges a successful update into the matching subscription', async () => {
        activateAuthSession('user-1');
        const renamed = {
            ...serverSubscription,
            service_name: 'Renamed',
            plan_name: undefined,
            memo: undefined,
        };
        useSubscriptionStore.setState({
            subscriptions: [serverSubscription],
        });
        updateMock.mockResolvedValue(renamed);

        await useSubscriptionStore.getState().updateSubscription(42, {
            service_name: 'Renamed',
            plan_name: null,
            memo: null,
        });

        expect(updateMock).toHaveBeenCalledWith(42, {
            service_name: 'Renamed',
            plan_name: null,
            memo: null,
        });
        expect(useSubscriptionStore.getState().subscriptions).toEqual([renamed]);
    });

    test('keeps local state when server-first deletion fails', async () => {
        activateAuthSession('user-1');
        useSubscriptionStore.setState({
            subscriptions: [serverSubscription],
        });
        deleteMock.mockRejectedValue(new Error('Delete failed'));

        await expect(useSubscriptionStore.getState().deleteSubscription(42))
            .rejects.toThrow('Delete failed');

        expect(useSubscriptionStore.getState()).toEqual(expect.objectContaining({
            subscriptions: [serverSubscription],
            isLoading: false,
            error: 'Delete failed',
        }));
    });

    test('removes a subscription after server deletion succeeds', async () => {
        activateAuthSession('user-1');
        useSubscriptionStore.setState({
            subscriptions: [
                serverSubscription,
                { ...serverSubscription, id: 43, service_name: 'Other' },
            ],
        });

        await useSubscriptionStore.getState().deleteSubscription(42);

        expect(deleteMock).toHaveBeenCalledWith(42);
        expect(useSubscriptionStore.getState().subscriptions.map(({ id }) => id))
            .toEqual([43]);
    });

    test('does not mutate without an active authentication session', async () => {
        await useSubscriptionStore.getState().addSubscription(createPayload);
        await useSubscriptionStore.getState().updateSubscription(42, {
            service_name: 'Renamed',
        });
        await useSubscriptionStore.getState().deleteSubscription(42);

        expect(createMock).not.toHaveBeenCalled();
        expect(updateMock).not.toHaveBeenCalled();
        expect(deleteMock).not.toHaveBeenCalled();
    });

    test('does not apply a mutation response after the authenticated user changes', async () => {
        let resolveRequest: (subscription: Subscription) => void = () => {};
        createMock.mockReturnValue(new Promise((resolve) => {
            resolveRequest = resolve;
        }));
        activateAuthSession('user-1');

        const createRequest = useSubscriptionStore.getState()
            .addSubscription(createPayload);
        activateAuthSession('user-2');
        resolveRequest(serverSubscription);
        await createRequest;

        expect(useSubscriptionStore.getState().subscriptions).toEqual([]);
    });

    test('uses a safe fallback message for an unknown mutation failure', async () => {
        activateAuthSession('user-1');
        createMock.mockRejectedValue('offline');

        await expect(useSubscriptionStore.getState().addSubscription(createPayload))
            .rejects.toBe('offline');

        expect(useSubscriptionStore.getState()).toEqual(expect.objectContaining({
            subscriptions: [],
            isLoading: false,
            error: 'Failed to add subscription',
        }));
    });

    test('clears errors and resets user-scoped state on logout', () => {
        useSubscriptionStore.setState({
            subscriptions: [serverSubscription],
            isLoading: true,
            error: 'Offline',
        });

        useSubscriptionStore.getState().clearError();
        expect(useSubscriptionStore.getState().error).toBeNull();

        useSubscriptionStore.setState({ error: 'Offline' });
        useSubscriptionStore.getState().resetForLogout();
        expect(useSubscriptionStore.getState()).toEqual(expect.objectContaining({
            subscriptions: [],
            isLoading: false,
            error: null,
        }));
    });
});
