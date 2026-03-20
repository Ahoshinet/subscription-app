import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Subscription } from './api';

// Configure notification behavior
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

const REMINDER_DAYS = [14, 7, 3, 1] as const;

export async function requestNotificationPermissions(): Promise<boolean> {
    if (Platform.OS === 'web') return false;

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    return finalStatus === 'granted';
}

export async function schedulePaymentReminders(
    subscriptions: Subscription[],
    t: (key: string, options?: Record<string, unknown>) => string
): Promise<void> {
    // Cancel all existing scheduled notifications first
    await Notifications.cancelAllScheduledNotificationsAsync();

    const now = new Date();

    for (const sub of subscriptions) {
        if (sub.status !== 'active') continue;

        const paymentDate = new Date(sub.next_payment_date);

        for (const daysBefore of REMINDER_DAYS) {
            const triggerDate = new Date(paymentDate);
            triggerDate.setDate(triggerDate.getDate() - daysBefore);
            triggerDate.setHours(9, 0, 0, 0); // 9:00 AM

            // Only schedule if the trigger date is in the future
            if (triggerDate.getTime() <= now.getTime()) continue;

            const secondsUntil = Math.floor((triggerDate.getTime() - now.getTime()) / 1000);

            await Notifications.scheduleNotificationAsync({
                content: {
                    title: t('notification.payment_reminder_title'),
                    body: daysBefore === 1
                        ? t('notification.payment_tomorrow', { name: sub.service_name, plan: sub.plan_name ?? '', price: sub.amount, currency: sub.currency })
                        : t('notification.payment_in_days', { name: sub.service_name, plan: sub.plan_name ?? '', price: sub.amount, currency: sub.currency, days: daysBefore }),
                    data: { subscriptionId: sub.id },
                },
                trigger: {
                    type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
                    seconds: secondsUntil,
                    repeats: false,
                },
            });
        }
    }
}

export async function cancelAllReminders(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
}
