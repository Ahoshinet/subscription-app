import {
    afterEach,
    beforeEach,
    describe,
    expect,
    jest,
    test,
} from '@jest/globals';
import * as Notifications from 'expo-notifications';

import type { Subscription } from './api';
import {
    cancelAllReminders,
    registerNotificationTapHandler,
    requestNotificationPermissions,
    schedulePaymentReminders,
} from './notifications';

jest.mock('../i18n', () => ({
    __esModule: true,
    default: {
        language: 'en',
    },
}));

jest.mock('expo-notifications', () => {
    const mockSubscription = {
        remove: jest.fn(),
    };
    return {
        SchedulableTriggerInputTypes: {
            TIME_INTERVAL: 'timeInterval',
        },
        setNotificationHandler: jest.fn(),
        getPermissionsAsync: jest.fn(),
        requestPermissionsAsync: jest.fn(),
        cancelAllScheduledNotificationsAsync: jest.fn(),
        scheduleNotificationAsync: jest.fn(),
        getLastNotificationResponse: jest.fn(),
        addNotificationResponseReceivedListener: jest.fn(() => mockSubscription),
        mockSubscription,
    };
});

const getPermissionsMock = jest.mocked(Notifications.getPermissionsAsync);
const requestPermissionsMock = jest.mocked(Notifications.requestPermissionsAsync);
const cancelScheduledMock = jest.mocked(
    Notifications.cancelAllScheduledNotificationsAsync,
);
const scheduleNotificationMock = jest.mocked(
    Notifications.scheduleNotificationAsync,
);
const getLastResponseMock = jest.mocked(
    Notifications.getLastNotificationResponse,
);
const addResponseListenerMock = jest.mocked(
    Notifications.addNotificationResponseReceivedListener,
);
const notificationSubscription = (
    jest.requireMock('expo-notifications') as {
        mockSubscription: { remove: jest.Mock<() => void> };
    }
).mockSubscription;

const activeSubscription: Subscription = {
    id: 42,
    user_id: 'user-1',
    service_name: 'Example',
    plan_name: 'Standard',
    amount: 1200,
    currency: 'JPY',
    billing_cycle: 'monthly',
    payment_method: 'card',
    next_payment_date: '2026-07-20',
    billing_anchor_day: 20,
    status: 'active',
};

function notificationResponse(
    identifier: string,
    subscriptionId: unknown,
): Notifications.NotificationResponse {
    return {
        notification: {
            request: {
                identifier,
                content: {
                    data: { subscriptionId },
                },
            },
        },
    } as unknown as Notifications.NotificationResponse;
}

describe('notifications', () => {
    beforeEach(async () => {
        jest.useFakeTimers();
        jest.setSystemTime(new Date('2026-07-01T00:30:00.000Z'));

        await cancelAllReminders();
        jest.clearAllMocks();

        getPermissionsMock.mockResolvedValue({
            status: 'granted',
        } as Awaited<ReturnType<typeof Notifications.getPermissionsAsync>>);
        requestPermissionsMock.mockResolvedValue({
            status: 'granted',
        } as Awaited<ReturnType<typeof Notifications.requestPermissionsAsync>>);
        cancelScheduledMock.mockResolvedValue();
        scheduleNotificationMock.mockResolvedValue('notification-id');
        getLastResponseMock.mockReturnValue(null);
    });

    afterEach(async () => {
        await cancelAllReminders();
        jest.useRealTimers();
    });

    test('uses an existing permission without prompting again', async () => {
        await expect(requestNotificationPermissions()).resolves.toBe(true);

        expect(getPermissionsMock).toHaveBeenCalledTimes(1);
        expect(requestPermissionsMock).not.toHaveBeenCalled();
    });

    test('requests permission when the existing status is not granted', async () => {
        getPermissionsMock.mockResolvedValue({
            status: 'undetermined',
        } as Awaited<ReturnType<typeof Notifications.getPermissionsAsync>>);

        await expect(requestNotificationPermissions()).resolves.toBe(true);

        expect(requestPermissionsMock).toHaveBeenCalledTimes(1);
    });

    test('schedules future reminders for active subscriptions in soonest-first order', async () => {
        const translate = jest.fn((key: string) => key);

        schedulePaymentReminders([activeSubscription], translate, 'UTC');
        await jest.advanceTimersByTimeAsync(300);

        expect(cancelScheduledMock).toHaveBeenCalledTimes(1);
        expect(scheduleNotificationMock).toHaveBeenCalledTimes(4);

        const seconds = scheduleNotificationMock.mock.calls.map(
            ([request]) => (
                request.trigger as Notifications.TimeIntervalTriggerInput
            ).seconds,
        );
        expect(seconds).toEqual([...seconds].sort((left, right) => left - right));
        expect(seconds.every((value) => value > 0)).toBe(true);
        expect(scheduleNotificationMock.mock.calls[0][0])
            .toEqual(expect.objectContaining({
                content: expect.objectContaining({
                    data: { subscriptionId: 42 },
                }),
                trigger: expect.objectContaining({
                    type: 'timeInterval',
                    repeats: false,
                }),
            }));
    });

    test('ignores inactive subscriptions', async () => {
        schedulePaymentReminders(
            [{ ...activeSubscription, status: 'paused' }],
            (key) => key,
            'UTC',
        );
        await jest.advanceTimersByTimeAsync(300);

        expect(cancelScheduledMock).toHaveBeenCalledTimes(1);
        expect(scheduleNotificationMock).not.toHaveBeenCalled();
    });

    test('skips cancel-and-reschedule when reminder inputs are unchanged', async () => {
        schedulePaymentReminders([activeSubscription], (key) => key, 'UTC');
        await jest.advanceTimersByTimeAsync(300);
        expect(cancelScheduledMock).toHaveBeenCalledTimes(1);

        schedulePaymentReminders([activeSubscription], (key) => key, 'UTC');
        await jest.advanceTimersByTimeAsync(300);

        expect(cancelScheduledMock).toHaveBeenCalledTimes(1);
        expect(scheduleNotificationMock).toHaveBeenCalledTimes(4);
    });

    test('cancels a pending debounce before it schedules reminders', async () => {
        schedulePaymentReminders([activeSubscription], (key) => key, 'UTC');

        await cancelAllReminders();
        await jest.advanceTimersByTimeAsync(300);

        expect(cancelScheduledMock).toHaveBeenCalledTimes(1);
        expect(scheduleNotificationMock).not.toHaveBeenCalled();
    });

    test('opens notification targets once and removes the listener on cleanup', () => {
        const coldStartResponse = notificationResponse('notification-1', 42);
        getLastResponseMock.mockReturnValue(coldStartResponse);
        const onOpen = jest.fn();

        const cleanup = registerNotificationTapHandler(onOpen);
        const listener = addResponseListenerMock.mock.calls[0][0];

        expect(onOpen).toHaveBeenCalledWith(42);
        listener(coldStartResponse);
        expect(onOpen).toHaveBeenCalledTimes(1);

        listener(notificationResponse('notification-2', '43'));
        expect(onOpen).toHaveBeenLastCalledWith(43);

        listener(notificationResponse('notification-3', 'not-a-number'));
        expect(onOpen).toHaveBeenCalledTimes(2);

        cleanup();
        expect(notificationSubscription.remove).toHaveBeenCalledTimes(1);
    });
});
