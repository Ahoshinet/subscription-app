import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, FlatList, TextInput } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSettingsStore } from '@/store/useSettingsStore';
import {
    formatTimeZoneOffset,
    getDeviceTimeZone,
    getSupportedTimeZones,
} from '@/lib/timeZone';

export default function TimeZoneSettingsScreen() {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const router = useRouter();
    const { t } = useTranslation();
    const { timeZone, setTimeZone } = useSettingsStore();
    const [query, setQuery] = useState('');
    const deviceTimeZone = getDeviceTimeZone();
    const allTimeZones = useMemo(() => getSupportedTimeZones(), []);
    const filteredTimeZones = useMemo(() => {
        const normalized = query.trim().toLowerCase();
        if (!normalized) return allTimeZones;
        return allTimeZones.filter((zone) => zone.toLowerCase().includes(normalized));
    }, [allTimeZones, query]);

    const selectTimeZone = (zone: string) => {
        setTimeZone(zone);
        setTimeout(() => router.back(), 200);
    };

    return (
        <View className="flex-1 bg-neutral-50 dark:bg-black">
            <Stack.Screen
                options={{
                    title: t('time_zone.title'),
                    headerBackTitle: ' ',
                    headerStyle: { backgroundColor: isDark ? '#000000' : '#ffffff' },
                    headerTintColor: isDark ? '#ffffff' : '#000000',
                }}
            />

            <View className="px-4 pt-4 pb-3">
                <View className="bg-white dark:bg-[#1C1C1E] rounded-xl flex-row items-center px-3" style={{ height: 44 }}>
                    <Ionicons name="search" size={18} color={isDark ? '#6B7280' : '#9CA3AF'} />
                    <TextInput
                        value={query}
                        onChangeText={setQuery}
                        placeholder={t('time_zone.search')}
                        placeholderTextColor={isDark ? '#52525B' : '#A1A1AA'}
                        autoCapitalize="none"
                        autoCorrect={false}
                        className="flex-1 text-base text-neutral-900 dark:text-white ml-2"
                    />
                </View>
            </View>

            <FlatList
                data={filteredTimeZones}
                keyExtractor={(zone) => zone}
                contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
                ListHeaderComponent={
                    <Text className="text-xs font-bold text-neutral-500 dark:text-neutral-400 tracking-wider ml-4 mb-2 mt-2">
                        {t('time_zone.section')}
                    </Text>
                }
                renderItem={({ item: zone, index }) => {
                    const selected = zone === timeZone;
                    const isFirst = index === 0;
                    const isLast = index === filteredTimeZones.length - 1;
                    return (
                        <Pressable
                            onPress={() => selectTimeZone(zone)}
                            className={[
                                'bg-white dark:bg-[#1C1C1E] flex-row items-center px-4 py-3 border-x border-neutral-200/50 dark:border-white/10',
                                isFirst ? 'rounded-t-2xl border-t' : '',
                                isLast
                                    ? 'rounded-b-2xl border-b'
                                    : 'border-b border-b-neutral-100 dark:border-b-white/5',
                            ].join(' ')}
                        >
                            <View className="flex-1 mr-3">
                                <Text className="text-base font-medium text-neutral-900 dark:text-white">
                                    {zone}
                                </Text>
                                <Text className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                                    {formatTimeZoneOffset(zone)}
                                    {zone === deviceTimeZone ? ` · ${t('time_zone.current_device')}` : ''}
                                </Text>
                            </View>
                            {selected ? <Ionicons name="checkmark" size={24} color="#3B82F6" /> : null}
                        </Pressable>
                    );
                }}
                initialNumToRender={20}
                maxToRenderPerBatch={20}
                windowSize={10}
                keyboardShouldPersistTaps="handled"
            />
        </View>
    );
}
