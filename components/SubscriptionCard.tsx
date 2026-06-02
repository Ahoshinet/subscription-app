import React, { useState } from 'react';
import { View, Text, Pressable, useColorScheme, Image } from 'react-native';
import { useTranslation } from 'react-i18next';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from 'react-native-reanimated';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { parseSubscriptionPresetIconValue } from '@/lib/subscriptionIcon';
import { resolveIconUrl } from '@/lib/api';

interface SubscriptionCardProps {
    id: number;
    serviceName: string;
    planName: string;
    amount: number;
    currency?: string;
    nextPaymentDate: string;
    daysRemaining: number;
    color?: string;
    iconName?: keyof typeof Ionicons.glyphMap;
    iconUrl?: string;
    onPress?: () => void;
}

export function SubscriptionCard({
    id,
    serviceName,
    planName,
    amount,
    currency = '¥',
    nextPaymentDate,
    daysRemaining,
    color = '#E50914',
    iconName = 'play-circle',
    iconUrl,
    onPress,
}: SubscriptionCardProps) {
    'use no memo';
    const scale = useSharedValue(1);
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const router = useRouter();
    const { t } = useTranslation();

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ scale: scale.value }],
        };
    });

    const handlePressIn = () => {
        // eslint-disable-next-line react-hooks/immutability
        scale.value = withSpring(0.98, { damping: 15, stiffness: 250 });
    };

    const handlePressOut = () => {
        // eslint-disable-next-line react-hooks/immutability
        scale.value = withSpring(1, { damping: 15, stiffness: 250 });
    };

    const handlePress = () => {
        if (onPress) {
            onPress();
        } else {
            router.push({ pathname: '/detail' as any, params: { id: String(id) } });
        }
    };

    // Calculate generic progress percentage (0-30 days max for visual)
    const progressPercent = Math.max(0, Math.min(100, (1 - daysRemaining / 30) * 100));

    // Accessibility and Colorblind-safe formatting
    const isUrgent = daysRemaining <= 3;
    const accessibleColor = isUrgent ? '#F97316' : '#3B82F6'; // Tailwind Orange-500 : Blue-500
    const accessibleIcon = isUrgent ? 'warning' : 'hourglass-outline';

    // Fallback semi-transparent colors
    const blurBackgroundColor = isDark ? 'rgba(28, 28, 30, 0.45)' : 'rgba(255, 255, 255, 0.6)';
    const blurTint = isDark ? 'dark' : 'light';
    const presetIcon = parseSubscriptionPresetIconValue(iconUrl);
    const [erroredIconUrl, setErroredIconUrl] = useState<string | undefined>(undefined);
    const imageError = iconUrl !== undefined && iconUrl === erroredIconUrl;

    return (
        <Pressable
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={handlePress}
            className="mb-5"
        >
            <Animated.View style={animatedStyle}>
                <View style={{ borderRadius: 24 }} className="border border-neutral-200 dark:border-white/10">
                <BlurView
                    intensity={100}
                    tint={blurTint}
                    style={{ backgroundColor: blurBackgroundColor, borderRadius: 23, overflow: 'hidden' }}
                >
                    {/* Main Content Area */}
                    <View className="p-5 flex-row items-center">
                        {/* Icon Badge */}
                        <View
                            className="w-14 h-14 rounded-2xl items-center justify-center mr-4"
                            style={{ backgroundColor: `${color}20` }}
                        >
                            {presetIcon ? (
                                presetIcon.pack === 'fontawesome5' ? (
                                    <FontAwesome5 name={presetIcon.name as any} size={30} color={presetIcon.color} />
                                ) : (
                                    <Ionicons name={presetIcon.name as any} size={32} color={presetIcon.color} />
                                )
                            ) : iconUrl && !imageError ? (
                                <Image
                                    source={{ uri: resolveIconUrl(iconUrl) }}
                                    style={{ width: 56, height: 56, borderRadius: 16 }}
                                    onError={() => setErroredIconUrl(iconUrl)}
                                />
                            ) : (
                                <Ionicons name={iconName} size={32} color={color} />
                            )}
                        </View>

                        {/* Service Info */}
                        <View className="flex-1">
                            <Text className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-1">
                                {serviceName}
                            </Text>
                            <Text className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                                {planName}
                            </Text>
                        </View>

                        {/* Pricing Info */}
                        <View className="items-end">
                            <Text className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
                                {currency}{amount.toLocaleString()}
                            </Text>
                            <Text className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mt-1">
                                {t('subscription_card.per_month')}
                            </Text>
                        </View>
                    </View>

                    {/* Bottom Status / Timeline Area */}
                    <View className="px-5 pb-5 mt-1">
                        <View className="flex-row justify-between items-center mb-3">
                            <View className="flex-row items-center">
                                <Ionicons name={accessibleIcon} size={16} color={accessibleColor} style={{ marginRight: 4 }} />
                                <Text className="text-sm font-bold uppercase tracking-wider" style={{ color: accessibleColor }}>
                                    {isUrgent ? t('subscription_card.action_required') : t('subscription_card.next_payment')}
                                </Text>
                            </View>

                            <Text className="text-base text-neutral-700 dark:text-neutral-300">
                                {daysRemaining === 0 ? (
                                    <Text className="font-extrabold" style={{ color: accessibleColor }}>{t('subscription_card.today')}</Text>
                                ) : (
                                    <Text className="font-extrabold" style={{ color: accessibleColor }}>{t('subscription_card.in_days', { count: daysRemaining })}</Text>
                                )}
                            </Text>
                        </View>

                        {/* Progress Bar Background */}
                        <View className="h-2 w-full bg-neutral-200/50 dark:bg-black/40 rounded-full overflow-hidden">
                            {/* Progress Bar Fill */}
                            <View
                                className="h-full rounded-full"
                                style={{
                                    width: `${progressPercent}%`,
                                    backgroundColor: accessibleColor,
                                    opacity: 0.9
                                }}
                            />
                        </View>
                    </View>
                </BlurView>
                </View>
            </Animated.View>
        </Pressable>
    );
}
