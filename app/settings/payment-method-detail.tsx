import React, { useState } from 'react';
import {
    View, Text, TextInput, Pressable,
    Alert, Image, ScrollView,
} from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { usePaymentMethodStore } from '@/store/usePaymentMethodStore';
import { resolveIconUrl } from '@/lib/api';
import { singleLineTextInputStyle } from '@/lib/textInputStyles';

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

    const bg = isDark ? '#0A0A0A' : '#F2F2F7';
    const cardBg = isDark ? '#1C1C1E' : '#FFFFFF';
    const textPrimary = isDark ? '#FFFFFF' : '#000000';
    const textSub = isDark ? '#8E8E93' : '#6B7280';
    const handleSave = async () => {
        try {
            // null clears the memo on the server (undefined would keep it)
            await updateMethod(id, { memo: memo.trim() ? memo.trim() : null });
            setIsDirty(false);
        } catch (e: any) {
            Alert.alert(t('common.error'), e.message || t('billing.update_failed'));
        }
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
                    onPress: async () => {
                        try {
                            await removeMethod(id);
                            router.back();
                        } catch (e: any) {
                            // e.g. 409: subscriptions still reference this method
                            Alert.alert(t('common.error'), e.message || t('billing.delete_failed'));
                        }
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
                    headerBackButtonDisplayMode: 'minimal',
                    headerStyle: { backgroundColor: isDark ? '#0A0A0A' : '#F2F2F7' },
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
                                source={{ uri: resolveIconUrl(method.iconUri) }}
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
                        style={{
                            ...singleLineTextInputStyle,
                            height: 48, fontSize: 16, color: textPrimary,
                        }}
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
