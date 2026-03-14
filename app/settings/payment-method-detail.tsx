import React, { useState } from 'react';
import {
    View, Text, TextInput, Pressable,
    Alert, Image, ScrollView, useColorScheme,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { usePaymentMethodStore } from '@/store/usePaymentMethodStore';

export default function PaymentMethodDetailScreen() {
    const params = useLocalSearchParams<{ id: string }>();
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    const router = useRouter();
    const { t } = useTranslation();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const { methods, removeMethod, updateMethod } = usePaymentMethodStore();

    const method = methods.find((m) => m.id === id);
    const [memo, setMemo] = useState(method?.memo ?? '');
    const [isDirty, setIsDirty] = useState(false);

    if (!method) return null;

    const bg = isDark ? '#000000' : '#F2F2F7';
    const cardBg = isDark ? '#1C1C1E' : '#FFFFFF';
    const textPrimary = isDark ? '#FFFFFF' : '#000000';
    const textSub = isDark ? '#8E8E93' : '#6B7280';
    const segBg = isDark ? '#2C2C2E' : '#F2F2F7';

    const handleSave = () => {
        updateMethod(id, { memo: memo.trim() || undefined });
        setIsDirty(false);
    };

    const handleDelete = () => {
        Alert.alert(
            method.label,
            t('billing.delete_confirm'),
            [
                { text: t('billing.cancel'), style: 'cancel' },
                {
                    text: t('billing.delete'),
                    style: 'destructive',
                    onPress: () => {
                        removeMethod(id);
                        router.back();
                    },
                },
            ],
        );
    };

    return (
        <View style={{ flex: 1, backgroundColor: bg }}>
            <Stack.Screen
                options={{
                    title: t('billing.title'),
                    headerBackTitle: ' ',
                    headerStyle: { backgroundColor: isDark ? '#1C1C1E' : '#F2F2F7' },
                    headerTintColor: textPrimary,
                    headerShadowVisible: false,
                }}
            />
            <ScrollView
                contentContainerStyle={{
                    paddingTop: 24,
                    paddingHorizontal: 16,
                    paddingBottom: 48,
                }}
                keyboardDismissMode="on-drag"
                keyboardShouldPersistTaps="handled"
            >
                {/* Icon + Name card */}
                <View
                    style={{
                        backgroundColor: cardBg,
                        borderRadius: 16,
                        padding: 24,
                        marginBottom: 28,
                        alignItems: 'center',
                    }}
                >
                    <View
                        style={{
                            width: 68, height: 68, borderRadius: 20,
                            backgroundColor: `${method.color}20`,
                            alignItems: 'center', justifyContent: 'center',
                            marginBottom: 14,
                        }}
                    >
                        {method.iconUri ? (
                            <Image
                                source={{ uri: method.iconUri }}
                                style={{ width: 50, height: 50, borderRadius: 14 }}
                            />
                        ) : (
                            <Ionicons
                                name={(method.iconName ?? 'card-outline') as any}
                                size={34}
                                color={method.color}
                            />
                        )}
                    </View>
                    <Text style={{ fontSize: 20, fontWeight: '700', color: textPrimary }}>
                        {method.label}
                    </Text>
                    {method.memo ? (
                        <Text style={{ fontSize: 14, color: textSub, marginTop: 4 }}>
                            {method.memo}
                        </Text>
                    ) : null}
                </View>

                {/* Memo edit section */}
                <Text
                    style={{
                        fontSize: 12, color: textSub, fontWeight: '600',
                        textTransform: 'uppercase', letterSpacing: 0.6,
                        marginBottom: 8, marginLeft: 4,
                    }}
                >
                    {t('billing.memo')}
                </Text>
                <View
                    style={{
                        backgroundColor: cardBg, borderRadius: 12,
                        paddingHorizontal: 16, marginBottom: 20,
                    }}
                >
                    <TextInput
                        value={memo}
                        onChangeText={(v) => { setMemo(v); setIsDirty(true); }}
                        placeholder={t('billing.memo_placeholder')}
                        placeholderTextColor={textSub}
                        style={{ fontSize: 16, color: textPrimary, paddingVertical: 14 }}
                        returnKeyType="done"
                        clearButtonMode="while-editing"
                    />
                </View>

                {isDirty && (
                    <Pressable
                        onPress={handleSave}
                        style={{
                            backgroundColor: '#3B82F6',
                            borderRadius: 14, paddingVertical: 16,
                            alignItems: 'center', marginBottom: 16,
                        }}
                    >
                        <Text style={{ fontSize: 16, fontWeight: '700', color: '#fff' }}>
                            {t('billing.save')}
                        </Text>
                    </Pressable>
                )}

                {/* Delete */}
                <Pressable
                    onPress={handleDelete}
                    style={{
                        backgroundColor: cardBg,
                        borderRadius: 14, paddingVertical: 16,
                        alignItems: 'center',
                        marginTop: isDirty ? 0 : 4,
                    }}
                >
                    <Text style={{ fontSize: 16, fontWeight: '600', color: '#EF4444' }}>
                        {t('billing.delete')}
                    </Text>
                </Pressable>
            </ScrollView>
        </View>
    );
}
