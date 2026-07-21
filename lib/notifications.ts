import { Platform } from 'react-native';
import Constants from 'expo-constants';
import i18n from '../i18n';
import { Subscription } from './api';
import { addDaysToDateOnly, getEffectiveNextPaymentDate } from './dateUtils';
import { getTodayDateInTimeZone, zonedDateTimeToDate } from './timeZone';

type NotificationsModule = typeof import('expo-notifications');

let _notifications: NotificationsModule | null = null;

function getNotifications(): NotificationsModule | null {
    // expo-notifications remote push removed from Expo Go on Android in SDK 53;
    // loading the module triggers push token auto-registration which crashes in that env.
    if (Platform.OS === 'android' && Constants.appOwnership === 'expo') return null;
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

// iOS silently drops scheduled local notifications beyond 64 pending.
// Schedule only the soonest reminders and keep a little headroom.
const MAX_SCHEDULED_NOTIFICATIONS = 60;

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

let scheduleTimer: ReturnType<typeof setTimeout> | null = null;

// Signature of the last successfully scheduled state. Skips the
// cancel-and-reschedule cycle when nothing reminder-relevant changed
// (fetchSubscriptions replaces the array identity on every focus).
let lastScheduleSignature: string | null = null;

function reminderSignature(subscriptions: Subscription[], language: string, timeZone: string): string {
    return `${language}:${timeZone}|` + subscriptions
        .filter((s) => s.status === 'active')
        .map((s) => `${s.id}:${s.next_payment_date}:${s.billing_cycle}:${s.billing_anchor_day ?? ''}:${s.amount}:${s.currency}:${s.service_name}:${s.plan_name ?? ''}`)
        .sort()
        .join('|');
}

export function schedulePaymentReminders(
    subscriptions: Subscription[],
    t: (key: string, options?: Record<string, unknown>) => string,
    timeZone: string,
): void {
    if (scheduleTimer) clearTimeout(scheduleTimer);
    scheduleTimer = setTimeout(() => {
        scheduleTimer = null;
        _doSchedule(subscriptions, t, timeZone);
    }, 300);
}

async function _doSchedule(
    subscriptions: Subscription[],
    t: (key: string, options?: Record<string, unknown>) => string,
    timeZone: string,
): Promise<void> {
    const N = getNotifications();
    if (!N) return;

    const signature = reminderSignature(subscriptions, i18n.language, timeZone);
    if (signature === lastScheduleSignature) return;

    await N.cancelAllScheduledNotificationsAsync();

    const now = new Date();
    const todayDate = getTodayDateInTimeZone(timeZone);
    const candidates: { triggerDate: Date; daysBefore: number; sub: Subscription }[] = [];

    for (const sub of subscriptions) {
        if (sub.status !== 'active') continue;

        const paymentDate = getEffectiveNextPaymentDate(
            sub.next_payment_date,
            sub.billing_cycle,
            todayDate,
            sub.billing_anchor_day,
        );

        for (const daysBefore of REMINDER_DAYS) {
            const reminderDate = addDaysToDateOnly(paymentDate, -daysBefore);
            const triggerDate = zonedDateTimeToDate(reminderDate, timeZone, 9, 0);
            if (!triggerDate) continue;

            if (triggerDate.getTime() <= now.getTime()) continue;

            candidates.push({ triggerDate, daysBefore, sub });
        }
    }

    // Soonest first, so the iOS pending-notification cap drops only the
    // most distant reminders.
    candidates.sort((a, b) => a.triggerDate.getTime() - b.triggerDate.getTime());

    for (const { triggerDate, daysBefore, sub } of candidates.slice(0, MAX_SCHEDULED_NOTIFICATIONS)) {
        // expo-notifications can crash on a TIME_INTERVAL trigger of 0 seconds
        const secondsUntil = Math.max(1, Math.floor((triggerDate.getTime() - now.getTime()) / 1000));

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

    lastScheduleSignature = signature;
}

export async function cancelAllReminders(): Promise<void> {
    lastScheduleSignature = null;
    const N = getNotifications();
    if (!N) return;
    await N.cancelAllScheduledNotificationsAsync();
}

function extractSubscriptionId(
    response: import('expo-notifications').NotificationResponse | null
): number | null {
    const raw = response?.notification.request.content.data?.subscriptionId;
    if (raw == null) return null;
    const id = Number(raw);
    return Number.isFinite(id) ? id : null;
}

// Wires up notification taps so they open the matching subscription's detail
// screen. Handles both a running/backgrounded app and a cold start launched
// from the notification (getLastNotificationResponseAsync). `onOpen` should
// navigate; it is only called once per tap. Returns a cleanup function.
export function registerNotificationTapHandler(
    onOpen: (subscriptionId: number) => void
): () => void {
    const N = getNotifications();
    if (!N) return () => {};

    // A cold-start response is also delivered to the listener on some
    // platforms, so de-dupe by the response's notification identifier.
    let handledId: string | null = null;
    const handle = (response: import('expo-notifications').NotificationResponse | null) => {
        if (!response) return;
        const notificationId = response.notification.request.identifier;
        if (notificationId === handledId) return;
        handledId = notificationId;
        const subscriptionId = extractSubscriptionId(response);
        if (subscriptionId != null) onOpen(subscriptionId);
    };

    N.getLastNotificationResponseAsync().then(handle);
    const sub = N.addNotificationResponseReceivedListener(handle);
    return () => sub.remove();
}
