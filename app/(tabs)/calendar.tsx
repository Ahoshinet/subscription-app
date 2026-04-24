import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import {
    View, Text, SafeAreaView, TouchableOpacity,
    ScrollView, useColorScheme, Image, Dimensions, Modal, Platform,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withSpring,
    runOnJS,
} from 'react-native-reanimated';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { useSubscriptionStore } from '../../store/useSubscriptionStore';
import { getEffectiveNextPaymentDate } from '../../lib/dateUtils';
import { CURRENCY_SYMBOLS } from '../../lib/currency';
import { parseSubscriptionPresetIconValue } from '../../lib/subscriptionIcon';
import { Subscription } from '../../lib/api';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CELL_WIDTH = Math.floor(SCREEN_WIDTH / 7);
const CELL_HEIGHT = Math.floor((SCREEN_HEIGHT * 0.42) / 6);
const CIRCLE_SIZE = Math.min(CELL_WIDTH - 6, CELL_HEIGHT - 14, 48);

const WEEKDAYS_JA = ['日', '月', '火', '水', '木', '金', '土'];
const WEEKDAYS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const SWIPE_THRESHOLD = 50;
const VELOCITY_THRESHOLD = 600;
const ANIM_DURATION = 210;

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
    const [selectedDay, setSelectedDay] = useState<number | null>(null);
    const [showPicker, setShowPicker] = useState(false);
    const [pickerDate, setPickerDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

    // Keep a ref so gesture callbacks can read current month/year without stale closure
    const currentRef = useRef({ month, year });
    useEffect(() => { currentRef.current = { month, year }; }, [month, year]);

    useEffect(() => {
        if (subscriptions.length === 0) fetchSubscriptions();
    }, []);

    const isJa = i18n.language === 'ja';
    const weekdays = isJa ? WEEKDAYS_JA : WEEKDAYS_EN;

    const todayY = today.getFullYear();
    const todayM = today.getMonth();
    const todayD = today.getDate();

    const dayToSubs = useMemo(() => {
        const map: Record<number, Subscription[]> = {};
        for (const sub of subscriptions) {
            if (sub.status !== 'active') continue;
            const days = getPaymentDaysInMonth(sub.next_payment_date, sub.billing_cycle, year, month);
            for (const d of days) {
                const isPastDay = year < todayY
                    || (year === todayY && month < todayM)
                    || (year === todayY && month === todayM && d < todayD);
                if (!isPastDay) (map[d] ??= []).push(sub);
            }
        }
        return map;
    }, [subscriptions, year, month, todayY, todayM, todayD]);

    const totalPayments = useMemo(
        () => Object.values(dayToSubs).reduce((sum, subs) => sum + subs.length, 0),
        [dayToSubs],
    );

    // All payments in the month, sorted by day — shown when no day is selected
    const monthSubs = useMemo(() => {
        const result: { sub: Subscription; day: number }[] = [];
        for (const [dayStr, subs] of Object.entries(dayToSubs)) {
            const day = Number(dayStr);
            for (const sub of subs) result.push({ sub, day });
        }
        return result.sort((a, b) => a.day - b.day);
    }, [dayToSubs]);

    const calendarRows = useMemo(() => chunk(buildCalendarDays(year, month), 7), [year, month]);
    const selectedSubs = selectedDay != null ? (dayToSubs[selectedDay] ?? []) : [];

    // Animation
    const translateX = useSharedValue(0);
    const animating = useSharedValue(false);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: translateX.value }],
    }));

    const applyMonthChange = useCallback((direction: 'prev' | 'next') => {
        const { month: m, year: y } = currentRef.current;
        if (direction === 'prev') {
            if (m === 0) { setYear(y - 1); setMonth(11); }
            else setMonth(m - 1);
        } else {
            if (m === 11) { setYear(y + 1); setMonth(0); }
            else setMonth(m + 1);
        }
        setSelectedDay(null);
    }, []);

    const navigate = useCallback((direction: 'prev' | 'next') => {
        if (animating.value) return;
        animating.value = true;
        const outX = direction === 'next' ? -SCREEN_WIDTH : SCREEN_WIDTH;
        const inX = -outX;
        translateX.value = withTiming(outX, { duration: ANIM_DURATION }, (finished) => {
            'worklet';
            if (finished) {
                runOnJS(applyMonthChange)(direction);
                translateX.value = inX;
                translateX.value = withTiming(0, { duration: ANIM_DURATION }, () => {
                    'worklet';
                    animating.value = false;
                });
            } else {
                animating.value = false;
            }
        });
    }, [applyMonthChange]);

    const swipeGesture = useMemo(() =>
        Gesture.Pan()
            .activeOffsetX([-10, 10])
            .failOffsetY([-15, 15])
            .onUpdate((e) => {
                if (!animating.value) {
                    translateX.value = e.translationX;
                }
            })
            .onEnd((e) => {
                if (animating.value) return;
                const tx = e.translationX;
                const vx = e.velocityX;
                if (tx < -SWIPE_THRESHOLD || vx < -VELOCITY_THRESHOLD) {
                    animating.value = true;
                    translateX.value = withTiming(-SCREEN_WIDTH, { duration: ANIM_DURATION }, (finished) => {
                        'worklet';
                        if (finished) {
                            runOnJS(applyMonthChange)('next');
                            translateX.value = SCREEN_WIDTH;
                            translateX.value = withTiming(0, { duration: ANIM_DURATION }, () => {
                                'worklet';
                                animating.value = false;
                            });
                        } else {
                            animating.value = false;
                        }
                    });
                } else if (tx > SWIPE_THRESHOLD || vx > VELOCITY_THRESHOLD) {
                    animating.value = true;
                    translateX.value = withTiming(SCREEN_WIDTH, { duration: ANIM_DURATION }, (finished) => {
                        'worklet';
                        if (finished) {
                            runOnJS(applyMonthChange)('prev');
                            translateX.value = -SCREEN_WIDTH;
                            translateX.value = withTiming(0, { duration: ANIM_DURATION }, () => {
                                'worklet';
                                animating.value = false;
                            });
                        } else {
                            animating.value = false;
                        }
                    });
                } else {
                    translateX.value = withSpring(0, { damping: 20, stiffness: 300 });
                }
            }),
        [applyMonthChange],
    );

    const headerText = isJa
        ? `${year}年 ${month + 1}月 - ${totalPayments}件の支払`
        : `${year}/${String(month + 1).padStart(2, '0')} - ${totalPayments} payments`;

    const selectedLabel = selectedDay != null
        ? isJa
            ? `${month + 1}月${selectedDay}日`
            : new Date(year, month, selectedDay).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
        : null;

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? '#0a0a0a' : '#fafafa' }}>
            {/* Header */}
            <View className="flex-row items-center justify-between px-4 pt-5 pb-3">
                <TouchableOpacity
                    onPress={() => {
                        setPickerDate(new Date(year, month, 1));
                        setShowPicker(true);
                    }}
                    activeOpacity={0.7}
                    style={{ flex: 1 }}
                >
                    <Text className="text-xl font-bold text-neutral-900 dark:text-white" numberOfLines={1}>
                        {headerText}
                    </Text>
                </TouchableOpacity>
                <View className="flex-row items-center ml-3">
                    <TouchableOpacity onPress={() => navigate('prev')} className="p-2" activeOpacity={0.7}>
                        <Ionicons name="chevron-back" size={26} color={isDark ? '#e5e5e5' : '#171717'} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => navigate('next')} className="p-2 ml-1" activeOpacity={0.7}>
                        <Ionicons name="chevron-forward" size={26} color={isDark ? '#e5e5e5' : '#171717'} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Weekday headers (static, outside animation) */}
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

            {/* Calendar grid — swipeable + animated */}
            <GestureDetector gesture={swipeGesture}>
                <Animated.View style={[{ overflow: 'hidden' }, animatedStyle]}>
                    {calendarRows.map((week, wi) => (
                        <View key={wi} style={{ flexDirection: 'row', height: CELL_HEIGHT }}>
                            {week.map((day, di) => {
                                if (day === null) {
                                    return (
                                        <TouchableOpacity
                                            key={di}
                                            style={{ width: CELL_WIDTH, height: CELL_HEIGHT }}
                                            onPress={() => setSelectedDay(null)}
                                            activeOpacity={1}
                                        />
                                    );
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
                </Animated.View>
            </GestureDetector>

            {/* Divider */}
            <View className="h-px bg-neutral-200 dark:bg-neutral-800 mx-4 mt-2" />

            {/* Section label */}
            <View className="px-4 pt-3 pb-1">
                <Text className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
                    {selectedLabel ?? (isJa ? `${month + 1}月の支払` : `${new Date(year, month).toLocaleDateString(i18n.language, { month: 'long' })} payments`)}
                </Text>
            </View>

            {/* Subscription list */}
            <View style={{ flex: 1 }}>
            <ScrollView
                contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
            >
                <View key={selectedDay == null ? 'month' : `day-${selectedDay}`}>
                {selectedDay == null ? (
                    monthSubs.length === 0 ? (
                        <View className="items-center mt-10">
                            <Ionicons name="checkmark-circle-outline" size={36} color={isDark ? '#404040' : '#d4d4d4'} />
                            <Text className="text-sm text-neutral-400 dark:text-neutral-600 mt-3">
                                {t('calendar.no_payments')}
                            </Text>
                        </View>
                    ) : (
                        monthSubs.map(({ sub, day }, idx) => {
                            const presetIcon = parseSubscriptionPresetIconValue(sub.icon_url);
                            const currencySymbol = CURRENCY_SYMBOLS[sub.currency] ?? sub.currency;
                            return (
                                <TouchableOpacity
                                    key={`${sub.id}-${day}-${idx}`}
                                    onPress={() => router.push({ pathname: '/detail' as any, params: { id: String(sub.id) } })}
                                    className="flex-row items-center py-3 border-b border-neutral-100 dark:border-neutral-800/80"
                                    activeOpacity={0.7}
                                >
                                    {/* Day badge */}
                                    <View style={{ width: 30, alignItems: 'center', marginRight: 10 }}>
                                        <Text style={{ fontSize: 16, fontWeight: '700', color: '#3B82F6', lineHeight: 18 }}>
                                            {day}
                                        </Text>
                                        <Text style={{ fontSize: 9, color: isDark ? '#737373' : '#a3a3a3' }}>
                                            {isJa ? '日' : 'th'}
                                        </Text>
                                    </View>
                                    <View className="w-9 h-9 rounded-xl items-center justify-center mr-3 bg-neutral-100 dark:bg-neutral-800">
                                        {presetIcon ? (
                                            presetIcon.pack === 'fontawesome5' ? (
                                                <FontAwesome5 name={presetIcon.name as any} size={18} color={presetIcon.color} />
                                            ) : (
                                                <Ionicons name={presetIcon.name as any} size={20} color={presetIcon.color} />
                                            )
                                        ) : sub.icon_url ? (
                                            <Image source={{ uri: sub.icon_url }} style={{ width: 26, height: 26, borderRadius: 6 }} />
                                        ) : (
                                            <Ionicons name="card-outline" size={20} color="#3B82F6" />
                                        )}
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-sm font-semibold text-neutral-900 dark:text-neutral-100" numberOfLines={1}>
                                            {sub.service_name}
                                        </Text>
                                        {sub.plan_name ? (
                                            <Text className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5" numberOfLines={1}>
                                                {sub.plan_name}
                                            </Text>
                                        ) : null}
                                    </View>
                                    <Text className="text-sm font-bold text-neutral-900 dark:text-neutral-100 ml-3">
                                        {currencySymbol}{sub.amount.toLocaleString()}
                                    </Text>
                                    <Ionicons name="chevron-forward" size={16} color={isDark ? '#525252' : '#d4d4d4'} style={{ marginLeft: 6 }} />
                                </TouchableOpacity>
                            );
                        })
                    )
                ) : selectedSubs.length === 0 ? (
                    <View style={{ alignItems: 'center', marginTop: 40 }}>
                        <Ionicons name="checkmark-circle-outline" size={36} color={isDark ? '#404040' : '#d4d4d4'} />
                        <Text style={{ fontSize: 14, color: isDark ? '#525252' : '#a3a3a3', marginTop: 12 }}>
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
                                style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: isDark ? 'rgba(38,38,38,0.8)' : '#f5f5f5' }}
                                activeOpacity={0.7}
                            >
                                <View style={{ width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12, backgroundColor: isDark ? '#262626' : '#f5f5f5' }}>
                                    {presetIcon ? (
                                        presetIcon.pack === 'fontawesome5' ? (
                                            <FontAwesome5 name={presetIcon.name as any} size={20} color={presetIcon.color} />
                                        ) : (
                                            <Ionicons name={presetIcon.name as any} size={22} color={presetIcon.color} />
                                        )
                                    ) : sub.icon_url ? (
                                        <Image source={{ uri: sub.icon_url }} style={{ width: 28, height: 28, borderRadius: 6 }} />
                                    ) : (
                                        <Ionicons name="card-outline" size={22} color="#3B82F6" />
                                    )}
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ fontSize: 14, fontWeight: '600', color: isDark ? '#f5f5f5' : '#171717' }} numberOfLines={1}>
                                        {sub.service_name}
                                    </Text>
                                    {sub.plan_name ? (
                                        <Text style={{ fontSize: 12, color: isDark ? '#a3a3a3' : '#737373', marginTop: 2 }} numberOfLines={1}>
                                            {sub.plan_name}
                                        </Text>
                                    ) : null}
                                </View>
                                <Text style={{ fontSize: 14, fontWeight: '700', color: isDark ? '#f5f5f5' : '#171717', marginLeft: 12 }}>
                                    {currencySymbol}{sub.amount.toLocaleString()}
                                </Text>
                                <Ionicons name="chevron-forward" size={16} color={isDark ? '#525252' : '#d4d4d4'} style={{ marginLeft: 6 }} />
                            </TouchableOpacity>
                        );
                    })
                )}
                </View>
            </ScrollView>
            </View>
            {/* Month/Year picker */}
            {Platform.OS === 'android' && showPicker && (
                <DateTimePicker
                    value={pickerDate}
                    mode="date"
                    display="spinner"
                    onChange={(_: DateTimePickerEvent, date?: Date) => {
                        setShowPicker(false);
                        if (date) {
                            setYear(date.getFullYear());
                            setMonth(date.getMonth());
                            setSelectedDay(null);
                        }
                    }}
                />
            )}
            {Platform.OS === 'ios' && (
                <Modal
                    visible={showPicker}
                    transparent
                    animationType="slide"
                    onRequestClose={() => setShowPicker(false)}
                >
                    <TouchableOpacity
                        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }}
                        activeOpacity={1}
                        onPress={() => setShowPicker(false)}
                    />
                    <View style={{ backgroundColor: isDark ? '#1c1c1e' : '#ffffff', paddingBottom: 34 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: isDark ? '#3a3a3c' : '#e5e5ea' }}>
                            <TouchableOpacity onPress={() => setShowPicker(false)}>
                                <Text style={{ fontSize: 17, color: '#3B82F6', fontWeight: '600' }}>
                                    {isJa ? '完了' : 'Done'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                        <DateTimePicker
                            value={pickerDate}
                            mode="date"
                            display="spinner"
                            locale={isJa ? 'ja-JP' : 'en-US'}
                            onChange={(_: DateTimePickerEvent, date?: Date) => {
                                if (date) {
                                    setPickerDate(date);
                                    setYear(date.getFullYear());
                                    setMonth(date.getMonth());
                                    setSelectedDay(null);
                                }
                            }}
                            style={{ backgroundColor: isDark ? '#1c1c1e' : '#ffffff' }}
                        />
                    </View>
                </Modal>
            )}
        </SafeAreaView>
    );
}
