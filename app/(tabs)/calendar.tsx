import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
    View, Text, SafeAreaView, TouchableOpacity,
    ScrollView, useColorScheme, Image, Dimensions,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CELL_WIDTH = Math.floor(SCREEN_WIDTH / 7);
const CELL_HEIGHT = Math.floor((SCREEN_HEIGHT * 0.55) / 6);
const CIRCLE_SIZE = Math.min(CELL_WIDTH - 6, CELL_HEIGHT - 14, 48);
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { useSubscriptionStore } from '../../store/useSubscriptionStore';
import { getEffectiveNextPaymentDate } from '../../lib/dateUtils';
import { CURRENCY_SYMBOLS } from '../../lib/currency';
import { parseSubscriptionPresetIconValue } from '../../lib/subscriptionIcon';
import { Subscription } from '../../lib/api';

const WEEKDAYS_JA = ['日', '月', '火', '水', '木', '金', '土'];
const WEEKDAYS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getPaymentDaysInMonth(
    nextPaymentDate: string,
    billingCycle: string,
    year: number,
    month: number,
): number[] {
    const effective = new Date(getEffectiveNextPaymentDate(nextPaymentDate, billingCycle));
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    if (billingCycle === 'monthly') {
        return [Math.min(effective.getDate(), daysInMonth)];
    }

    if (billingCycle === 'yearly') {
        return effective.getMonth() === month ? [effective.getDate()] : [];
    }

    if (billingCycle === 'weekly') {
        const target = new Date(year, month, 1);
        const targetEnd = new Date(year, month + 1, 0);
        const d = new Date(effective);
        while (d < target) d.setDate(d.getDate() + 7);
        const days: number[] = [];
        while (d <= targetEnd) {
            days.push(d.getDate());
            d.setDate(d.getDate() + 7);
        }
        return days;
    }

    return [];
}

function buildCalendarDays(year: number, month: number): (number | null)[] {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
}

function chunk<T>(arr: T[], size: number): T[][] {
    const result: T[][] = [];
    for (let i = 0; i < arr.length; i += size) result.push(arr.slice(i, i + size));
    return result;
}

export default function CalendarScreen() {
    const { t, i18n } = useTranslation();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const router = useRouter();
    const { subscriptions, fetchSubscriptions } = useSubscriptionStore();

    const today = new Date();
    const [year, setYear] = useState(today.getFullYear());
    const [month, setMonth] = useState(today.getMonth());
    const [selectedDay, setSelectedDay] = useState<number | null>(today.getDate());

    useEffect(() => {
        if (subscriptions.length === 0) fetchSubscriptions();
    }, []);

    const isJa = i18n.language === 'ja';
    const weekdays = isJa ? WEEKDAYS_JA : WEEKDAYS_EN;

    const dayToSubs = useMemo(() => {
        const map: Record<number, Subscription[]> = {};
        for (const sub of subscriptions) {
            if (sub.status !== 'active') continue;
            const days = getPaymentDaysInMonth(sub.next_payment_date, sub.billing_cycle, year, month);
            for (const d of days) {
                (map[d] ??= []).push(sub);
            }
        }
        return map;
    }, [subscriptions, year, month]);

    const totalPayments = useMemo(
        () => Object.values(dayToSubs).reduce((sum, subs) => sum + subs.length, 0),
        [dayToSubs],
    );

    const calendarRows = useMemo(() => chunk(buildCalendarDays(year, month), 7), [year, month]);
    const selectedSubs = selectedDay != null ? (dayToSubs[selectedDay] ?? []) : [];

    const prevMonth = useCallback(() => {
        if (month === 0) { setYear(y => y - 1); setMonth(11); }
        else setMonth(m => m - 1);
        setSelectedDay(null);
    }, [month]);

    const nextMonth = useCallback(() => {
        if (month === 11) { setYear(y => y + 1); setMonth(0); }
        else setMonth(m => m + 1);
        setSelectedDay(null);
    }, [month]);

    const swipeGesture = useMemo(() =>
        Gesture.Pan()
            .activeOffsetX([-40, 40])
            .failOffsetY([-20, 20])
            .runOnJS(true)
            .onEnd((e) => {
                if (e.translationX < -40) nextMonth();
                else if (e.translationX > 40) prevMonth();
            }),
        [prevMonth, nextMonth],
    );

    const todayY = today.getFullYear();
    const todayM = today.getMonth();
    const todayD = today.getDate();

    const headerText = isJa
        ? `${year}年 ${month + 1}月 - ${totalPayments}件の支払`
        : `${year}/${String(month + 1).padStart(2, '0')} - ${totalPayments} payments`;

    const selectedLabel = selectedDay != null
        ? isJa
            ? `${month + 1}月${selectedDay}日`
            : new Date(year, month, selectedDay).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
        : null;

    return (
        <SafeAreaView className="flex-1 bg-neutral-50 dark:bg-neutral-950">
            {/* Header */}
            <View className="flex-row items-center justify-between px-4 pt-5 pb-7">
                <Text className="text-xl font-bold text-neutral-900 dark:text-white flex-1" numberOfLines={1}>
                    {headerText}
                </Text>
                <View className="flex-row items-center ml-3">
                    <TouchableOpacity onPress={prevMonth} className="p-2" activeOpacity={0.7}>
                        <Ionicons name="chevron-back" size={26} color={isDark ? '#e5e5e5' : '#171717'} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={nextMonth} className="p-2 ml-1" activeOpacity={0.7}>
                        <Ionicons name="chevron-forward" size={26} color={isDark ? '#e5e5e5' : '#171717'} />
                    </TouchableOpacity>
                </View>
            </View>

            <GestureDetector gesture={swipeGesture}>
            <View>
            {/* Weekday headers */}
            <View style={{ flexDirection: 'row' }}>
                {weekdays.map((wd, i) => (
                    <Text
                        key={i}
                        style={{
                            width: CELL_WIDTH,
                            textAlign: 'center',
                            fontSize: 12,
                            fontWeight: '600',
                            paddingVertical: 4,
                            color: i === 0 ? '#EF4444' : i === 6 ? '#3B82F6' : isDark ? '#737373' : '#a3a3a3',
                        }}
                    >
                        {wd}
                    </Text>
                ))}
            </View>

            {/* Calendar grid */}
            <View>
                {calendarRows.map((week, wi) => (
                    <View key={wi} style={{ flexDirection: 'row', height: CELL_HEIGHT }}>
                        {week.map((day, di) => {
                            if (day === null) {
                                return <View key={di} style={{ width: CELL_WIDTH }} />;
                            }
                            const isToday = year === todayY && month === todayM && day === todayD;
                            const isSelected = day === selectedDay;
                            const hasSubs = (dayToSubs[day]?.length ?? 0) > 0;
                            const isSun = di === 0;
                            const isSat = di === 6;

                            const textColor = isSelected ? '#ffffff'
                                : isToday ? '#3B82F6'
                                : isSun ? '#EF4444'
                                : isSat ? '#3B82F6'
                                : isDark ? '#f5f5f5' : '#171717';

                            const circleBg = isSelected ? '#3B82F6'
                                : isToday ? (isDark ? '#404040' : '#e5e5e5')
                                : 'transparent';

                            return (
                                <TouchableOpacity
                                    key={di}
                                    onPress={() => setSelectedDay(isSelected ? null : day)}
                                    style={{ width: CELL_WIDTH, alignItems: 'center', justifyContent: 'center' }}
                                    activeOpacity={0.7}
                                >
                                    <View style={{
                                        width: CIRCLE_SIZE,
                                        height: CIRCLE_SIZE,
                                        borderRadius: CIRCLE_SIZE / 2,
                                        backgroundColor: circleBg,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}>
                                        <Text style={{
                                            color: textColor,
                                            fontSize: 15,
                                            fontWeight: isSelected || isToday ? '700' : '500',
                                        }}>
                                            {day}
                                        </Text>
                                    </View>
                                    <View style={{
                                        width: 6,
                                        height: 6,
                                        borderRadius: 3,
                                        marginTop: 2,
                                        backgroundColor: hasSubs
                                            ? (isSelected ? '#ffffff' : '#3B82F6')
                                            : 'transparent',
                                    }} />
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                ))}
            </View>
            </View>
            </GestureDetector>

            {/* Divider */}
            <View className="h-px bg-neutral-200 dark:bg-neutral-800 mx-4 mt-2" />

            {/* Selected day label */}
            {selectedLabel != null && (
                <View className="px-4 pt-3 pb-1">
                    <Text className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
                        {selectedLabel}
                    </Text>
                </View>
            )}

            {/* Subscription list */}
            <ScrollView
                className="flex-1"
                contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
            >
                {selectedDay == null ? (
                    <View className="items-center mt-12">
                        <Ionicons name="finger-print-outline" size={36} color={isDark ? '#404040' : '#d4d4d4'} />
                        <Text className="text-sm text-neutral-400 dark:text-neutral-600 mt-3">
                            {t('calendar.tap_to_view')}
                        </Text>
                    </View>
                ) : selectedSubs.length === 0 ? (
                    <View className="items-center mt-12">
                        <Ionicons name="checkmark-circle-outline" size={36} color={isDark ? '#404040' : '#d4d4d4'} />
                        <Text className="text-sm text-neutral-400 dark:text-neutral-600 mt-3">
                            {t('calendar.no_payments')}
                        </Text>
                    </View>
                ) : (
                    selectedSubs.map(sub => {
                        const presetIcon = parseSubscriptionPresetIconValue(sub.icon_url);
                        const currencySymbol = CURRENCY_SYMBOLS[sub.currency] ?? sub.currency;

                        return (
                            <TouchableOpacity
                                key={sub.id}
                                onPress={() => router.push({ pathname: '/detail' as any, params: { id: String(sub.id) } })}
                                className="flex-row items-center py-3.5 border-b border-neutral-100 dark:border-neutral-800/80"
                                activeOpacity={0.7}
                            >
                                <View className="w-10 h-10 rounded-xl items-center justify-center mr-3 bg-neutral-100 dark:bg-neutral-800">
                                    {presetIcon ? (
                                        presetIcon.pack === 'fontawesome5' ? (
                                            <FontAwesome5 name={presetIcon.name as any} size={20} color={presetIcon.color} />
                                        ) : (
                                            <Ionicons name={presetIcon.name as any} size={22} color={presetIcon.color} />
                                        )
                                    ) : sub.icon_url ? (
                                        <Image
                                            source={{ uri: sub.icon_url }}
                                            style={{ width: 28, height: 28, borderRadius: 6 }}
                                        />
                                    ) : (
                                        <Ionicons name="card-outline" size={22} color="#3B82F6" />
                                    )}
                                </View>
                                <View className="flex-1">
                                    <Text
                                        className="text-sm font-semibold text-neutral-900 dark:text-neutral-100"
                                        numberOfLines={1}
                                    >
                                        {sub.service_name}
                                    </Text>
                                    {sub.plan_name ? (
                                        <Text
                                            className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5"
                                            numberOfLines={1}
                                        >
                                            {sub.plan_name}
                                        </Text>
                                    ) : null}
                                </View>
                                <Text className="text-sm font-bold text-neutral-900 dark:text-neutral-100 ml-3">
                                    {currencySymbol}{sub.amount.toLocaleString()}
                                </Text>
                                <Ionicons
                                    name="chevron-forward"
                                    size={16}
                                    color={isDark ? '#525252' : '#d4d4d4'}
                                    style={{ marginLeft: 6 }}
                                />
                            </TouchableOpacity>
                        );
                    })
                )}
            </ScrollView>
        </SafeAreaView>
    );
}
