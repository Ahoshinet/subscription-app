import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    interpolateColor
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

interface SubscriptionCardProps {
    serviceName: string;
    planName: string;
    amount: number;
    currency?: string;
    nextPaymentDate: string;
    daysRemaining: number;
    color?: string;
    iconName?: keyof typeof Ionicons.glyphMap;
}

export function SubscriptionCard({
    serviceName,
    planName,
    amount,
    currency = '¥',
    nextPaymentDate,
    daysRemaining,
    color = '#E50914', // Default to Netflix red
    iconName = 'play-circle',
}: SubscriptionCardProps) {
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ scale: scale.value }],
        };
    });

    const handlePressIn = () => {
        scale.value = withSpring(0.96, { damping: 10, stiffness: 200 });
    };

    const handlePressOut = () => {
        scale.value = withSpring(1, { damping: 10, stiffness: 200 });
    };

    // Calculate generic progress percentage (0-30 days max for visual)
    const progressPercent = Math.max(0, Math.min(100, (1 - daysRemaining / 30) * 100));

    return (
        <Pressable
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            className="mb-4"
        >
            <Animated.View
                style={[animatedStyle]}
                className="overflow-hidden rounded-3xl border border-white/10 dark:border-white/5 bg-white/70 dark:bg-black/40 shadow-sm"
            >
                {/* Main Content Area */}
                <View className="p-5 flex-row items-center">

                    {/* Icon Badge */}
                    <View
                        className="w-14 h-14 rounded-2xl items-center justify-center mr-4"
                        style={{ backgroundColor: `${color}20` }}
                    >
                        <Ionicons name={iconName} size={32} color={color} />
                    </View>

                    {/* Service Info */}
                    <View className="flex-1">
                        <Text className="text-xl font-bold text-neutral-900 dark:text-white mb-1">
                            {serviceName}
                        </Text>
                        <Text className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                            {planName}
                        </Text>
                    </View>

                    {/* Pricing Info */}
                    <View className="items-end">
                        <Text className="text-xl font-bold text-neutral-900 dark:text-white">
                            {currency}{amount.toLocaleString()}
                        </Text>
                        <Text className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mt-1">
                            /mo
                        </Text>
                    </View>
                </View>

                {/* Bottom Status / Timeline Area */}
                <View className="px-5 pb-5 mt-2">
                    <View className="flex-row justify-between mb-2">
                        <Text className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                            Next Payment
                        </Text>
                        <Text className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                            {daysRemaining === 0 ? 'Today' : `in ${daysRemaining} days`}
                        </Text>
                    </View>

                    {/* Progress Bar Background */}
                    <View className="h-1.5 w-full bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                        {/* Progress Bar Fill */}
                        <View
                            className="h-full rounded-full"
                            style={{
                                width: `${progressPercent}%`,
                                backgroundColor: color,
                                opacity: 0.8
                            }}
                        />
                    </View>
                </View>

            </Animated.View>
        </Pressable>
    );
}
