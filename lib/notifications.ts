import { Platform } from 'react-native';
import { Subscription } from './api';

type NotificationsModule = typeof import('expo-notifications');

let _notifications: NotificationsModule | null = null;

function getNotifications(): NotificationsModule | null {
    if (_notifications) return _notifications;
    try {
        _notifications = require('expo-notifications') as NotificationsModule;
        _notifications.setNotificationHandler({
            handleNotification: async () => ({
                shouldShowAlert: true,
                shouldPlaySound: true,
                shouldSetBadge: false,
                shouldShowBanner: true,
                shouldShowList: true,
            }),
        });
        return _notifications;
    } catch {
        return null;
    }
}

const REMINDER_DAYS = [14, 7, 3, 1] as const;

export async function requestNotificationPermissions(): Promise<boolean> {
    if (Platform.OS === 'web') return false;
    const N = getNotifications();
    if (!N) return false;

    const { status: existingStatus } = await N.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
        const { status } = await N.requestPermissionsAsync();
        finalStatus = status;
    }

    return finalStatus === 'granted';
}

export async function schedulePaymentReminders(
    subscriptions: Subscription[],
    t: (key: string, options?: Record<string, unknown>) => string
): Promise<void> {
    const N = getNotifications();
    if (!N) return;

    await N.cancelAllScheduledNotificationsAsync();

    const now = new Date();

    for (const sub of subscriptions) {
        if (sub.status !== 'active') continue;

        const paymentDate = new Date(sub.next_payment_date);

        for (const daysBefore of REMINDER_DAYS) {
            const triggerDate = new Date(paymentDate);
            triggerDate.setDate(triggerDate.getDate() - daysBefore);
            triggerDate.setHours(9, 0, 0, 0);

            if (triggerDate.getTime() <= now.getTime()) continue;

            const secondsUntil = Math.floor((triggerDate.getTime() - now.getTime()) / 1000);

            await N.scheduleNotificationAsync({
                content: {
                    title: t('notification.payment_reminder_title'),
                    body: daysBefore === 1
                        ? t('notification.payment_tomorrow', { name: sub.service_name, plan: sub.plan_name ?? '', price: sub.amount, currency: sub.currency })
                        : t('notification.payment_in_days', { name: sub.service_name, plan: sub.plan_name ?? '', price: sub.amount, currency: sub.currency, days: daysBefore }),
                    data: { subscriptionId: sub.id },
                },
                trigger: {
                    type: N.SchedulableTriggerInputTypes.TIME_INTERVAL,
                    seconds: secondsUntil,
                    repeats: false,
                },
            });
        }
    }
}

export async function cancelAllReminders(): Promise<void> {
    const N = getNotifications();
    if (!N) return;
    await N.cancelAllScheduledNotificationsAsync();
}
