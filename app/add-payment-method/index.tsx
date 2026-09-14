import React, { useState } from 'react';
import {
    View, Text, Pressable, ScrollView, TextInput, Image,
    Dimensions, KeyboardAvoidingView, Alert, StyleSheet, Modal,
} from 'react-native';
import SegmentedControl from '@expo/ui/community/segmented-control';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { InvalidIconImageError, pickIconImage, type IconSource } from '@/lib/iconPicker';
import IconSourceSheet from '@/components/IconSourceSheet';
import { Stack, useRouter } from 'expo-router';
import { usePaymentMethodStore } from '@/store/usePaymentMethodStore';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { singleLineTextInputStyle } from '@/lib/textInputStyles';
import type { IoniconsName } from '@/lib/iconName';
import { CARD_BRANDS, CUSTOM_ICON_PRESETS, PRESET_BRANDS } from '@/lib/paymentMethodPresets';
import { paymentMethodAddErrorKey } from '@/lib/paymentMethodErrors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ICON_PICKER_WIDTH = Math.min(SCREEN_WIDTH - 32, 340);
const ICON_PICKER_GAP = 10;
const ICON_PICKER_TILE_SIZE = Math.floor((ICON_PICKER_WIDTH - 28 - ICON_PICKER_GAP * 2) / 3);

// iOS-only: first screen of the nested Stack in app/add-payment-method/_layout.tsx,
// which the root Stack presents as a native `presentation: 'modal'` sheet. The
// header uses the same unstable_headerLeftItems glass-button chrome as
// app/add.tsx. Android keeps its own animated bottom sheet in
// components/AddPaymentMethodSheet.tsx.
export default function AddPaymentMethodScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const { t } = useTranslation();
    const { addMethod } = usePaymentMethodStore();

    const [section, setSection] = useState<'brand' | 'card' | 'custom'>('brand');
    const [cardBrand, setCardBrand] = useState('Visa');
    const [cardLast4, setCardLast4] = useState('');
    const [customLabel, setCustomLabel] = useState('');
    const [customIconUri, setCustomIconUri] = useState<string | null>(null);
    const [customIconName, setCustomIconName] = useState<IoniconsName | null>(null);
    const [customIconColor, setCustomIconColor] = useState('#6B7280');
    const [showIconPresetModal, setShowIconPresetModal] = useState(false);
    const [showIconSourceSheet, setShowIconSourceSheet] = useState(false);

    const [cardMemo, setCardMemo] = useState('');
    const [customMemo, setCustomMemo] = useState('');

    const handleAddCard = async () => {
        if (cardLast4.length !== 4) return;
        router.back();
        try {
            await addMethod({
                type: 'credit_card',
                label: `${cardBrand} ••••${cardLast4}`,
                memo: cardMemo.trim() || undefined,
                iconName: 'card',
                color: '#6B7280',
                last4: cardLast4,
                cardBrand,
            });
        } catch (error) {
            Alert.alert(t('common.error'), t(paymentMethodAddErrorKey(error)));
        }
    };

    const handleAddCustom = async () => {
        if (!customLabel.trim()) return;
        router.back();
        try {
            await addMethod({
                type: 'custom',
                label: customLabel.trim(),
                memo: customMemo.trim() || undefined,
                iconUri: customIconUri ?? undefined,
                iconName: customIconUri ? undefined : (customIconName ?? 'wallet-outline'),
                color: customIconColor,
            });
        } catch (error) {
            Alert.alert(t('common.error'), t(paymentMethodAddErrorKey(error)));
        }
    };

    const pickIcon = async (source: IconSource) => {
        try {
            const asset = await pickIconImage(source, { allowsEditing: true });
            if (!asset) return;
            setCustomIconUri(asset.uri);
            setCustomIconName(null);
            setCustomIconColor('#6B7280');
        } catch (error) {
            if (error instanceof InvalidIconImageError) {
                Alert.alert(t('common.error'), t('billing.icon_file_invalid'));
                return;
            }
            throw error;
        }
    };

    const handleSelectPresetIcon = (iconName: IoniconsName, color: string) => {
        setCustomIconUri(null);
        setCustomIconName(iconName);
        setCustomIconColor(color);
        setShowIconPresetModal(false);
    };

    const openIconSourcePicker = () => setShowIconSourceSheet(true);

    const bg = isDark ? '#1C1C1E' : '#FFFFFF';
    const segBg = isDark ? '#2C2C2E' : '#F2F2F7';
    const textPrimary = isDark ? '#FFFFFF' : '#000000';
    const textSub = isDark ? '#8E8E93' : '#6B7280';
    const borderCol = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';
    // Matches the Settings row icon treatment (see docs/ios-settings-design.md)
    // instead of each brand's own color, so the list reads as one scannable set.
    const brandIconBg = isDark ? '#2C2C2E' : '#E5E5EA';
    const brandIconTint = isDark ? '#98989D' : '#636366';

    const tabs: { key: 'brand' | 'card' | 'custom'; label: string }[] = [
        { key: 'brand',  label: t('billing.tab_brand') },
        { key: 'card',   label: t('billing.tab_card') },
        { key: 'custom', label: t('billing.tab_custom') },
    ];
    const selectedTabIndex = tabs.findIndex((tab) => tab.key === section);

    return (
        <KeyboardAvoidingView style={{ flex: 1, backgroundColor: bg }} behavior="padding">
            <Stack.Screen
                options={{
                    title: t('billing.add_method_title'),
                    headerBackVisible: false,
                    unstable_headerLeftItems: () => [{
                        type: 'button',
                        label: t('billing.cancel'),
                        accessibilityLabel: t('billing.cancel'),
                        icon: { type: 'sfSymbol', name: 'xmark' },
                        variant: 'plain',
                        onPress: () => router.back(),
                    }],
                    headerStyle: { backgroundColor: bg },
                    headerTintColor: textPrimary,
                    headerTitleAlign: 'center',
                    headerShadowVisible: false,
                    headerShown: true,
                }}
            />

            <SegmentedControl
                values={tabs.map((tab) => tab.label)}
                selectedIndex={selectedTabIndex}
                appearance={isDark ? 'dark' : 'light'}
                onChange={(event) => {
                    const nextSection = tabs[event.nativeEvent.selectedSegmentIndex]?.key;
                    if (nextSection) setSection(nextSection);
                }}
                style={{ marginHorizontal: 20, marginTop: 16, marginBottom: 18 }}
                testID="payment-method-section-picker"
            />

            <ScrollView
                style={{ paddingHorizontal: 20 }}
                contentContainerStyle={{ paddingBottom: 44 }}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
                showsVerticalScrollIndicator={false}
            >
                {/* ── Brand ── */}
                {section === 'brand' && (
                    <View style={{ backgroundColor: segBg, borderRadius: 14, overflow: 'hidden' }}>
                        {PRESET_BRANDS.map((brand, index) => (
                            <Pressable
                                key={brand.id}
                                testID={`payment-brand-row-${brand.id}`}
                                accessibilityRole="button"
                                onPress={() => router.push({
                                    pathname: '/add-payment-method/[brandId]',
                                    params: { brandId: brand.id },
                                })}
                                style={{
                                    minHeight: 58,
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    paddingLeft: 12,
                                    paddingRight: 16,
                                }}
                            >
                                <View
                                    style={{
                                        width: 36,
                                        height: 36,
                                        borderRadius: 9,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        backgroundColor: brandIconBg,
                                    }}
                                >
                                    <Ionicons name={brand.iconName} size={20} color={brandIconTint} />
                                </View>
                                <View
                                    style={{
                                        flex: 1,
                                        minHeight: 58,
                                        marginLeft: 12,
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                    }}
                                >
                                    <Text style={{ flex: 1, fontSize: 16, color: textPrimary }}>
                                        {brand.label}
                                    </Text>
                                    <Ionicons name="chevron-forward" size={20} color={textSub} />
                                </View>
                                {index < PRESET_BRANDS.length - 1 && (
                                    <View
                                        pointerEvents="none"
                                        style={{
                                            position: 'absolute',
                                            left: 60,
                                            right: 16,
                                            bottom: 0,
                                            height: StyleSheet.hairlineWidth,
                                            backgroundColor: borderCol,
                                        }}
                                    />
                                )}
                            </Pressable>
                        ))}
                    </View>
                )}

                {/* ── Card ── */}
                {section === 'card' && (
                    <View>
                        <Text style={{ fontSize: 12, color: textSub, fontWeight: '600', marginBottom: 10 }}>
                            {t('billing.card_brand')}
                        </Text>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 22 }}>
                            {CARD_BRANDS.map((b) => (
                                <Pressable
                                    key={b}
                                    onPress={() => setCardBrand(b)}
                                    style={{
                                        paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
                                        backgroundColor: cardBrand === b ? '#3B82F6' : segBg,
                                        borderWidth: 1,
                                        borderColor: cardBrand === b ? '#3B82F6' : borderCol,
                                    }}
                                >
                                    <Text style={{ fontSize: 14, fontWeight: '500', color: cardBrand === b ? '#fff' : textPrimary }}>
                                        {b}
                                    </Text>
                                </Pressable>
                            ))}
                        </View>

                        <Text style={{ fontSize: 12, color: textSub, fontWeight: '600', marginBottom: 10 }}>
                            {t('billing.card_last4')}
                        </Text>
                        <View style={{ backgroundColor: segBg, borderRadius: 12, paddingHorizontal: 16, marginBottom: 24 }}>
                            <TextInput
                                value={cardLast4}
                                onChangeText={(v) => setCardLast4(v.replace(/\D/g, '').slice(0, 4))}
                                placeholder="0000"
                                placeholderTextColor={textSub}
                                keyboardType="numeric"
                                maxLength={4}
                                style={{
                                    ...singleLineTextInputStyle,
                                    height: 64,
                                    fontSize: 28, fontWeight: '700',
                                    letterSpacing: 10, color: textPrimary,
                                    textAlign: 'center',
                                }}
                            />
                        </View>

                        <Text style={{ fontSize: 12, color: textSub, fontWeight: '600', marginBottom: 10 }}>
                            {t('billing.memo')}
                        </Text>
                        <View style={{ backgroundColor: segBg, borderRadius: 12, paddingHorizontal: 16, marginBottom: 24 }}>
                            <TextInput
                                key="memo-card"
                                value={cardMemo}
                                onChangeText={setCardMemo}
                                placeholder={t('billing.memo_placeholder')}
                                placeholderTextColor={textSub}
                                autoCapitalize="none"
                                autoCorrect={false}
                                style={{
                                    ...singleLineTextInputStyle,
                                    height: 48, fontSize: 16, fontWeight: '400',
                                    letterSpacing: 0, textAlign: 'left', color: textPrimary,
                                }}
                            />
                        </View>

                        <Pressable
                            onPress={handleAddCard}
                            disabled={cardLast4.length !== 4}
                            style={{
                                backgroundColor: cardLast4.length === 4 ? '#3B82F6' : segBg,
                                borderRadius: 14, paddingVertical: 16, alignItems: 'center',
                            }}
                        >
                            <Text style={{ fontSize: 16, fontWeight: '700', color: cardLast4.length === 4 ? '#fff' : textSub }}>
                                {t('billing.add_button')}
                            </Text>
                        </Pressable>
                    </View>
                )}

                {/* ── Custom ── */}
                {section === 'custom' && (
                    <View>
                        <View style={{ alignItems: 'center', marginBottom: 24 }}>
                            <Pressable
                                onPress={openIconSourcePicker}
                                style={{
                                    width: 74, height: 74, borderRadius: 20,
                                    backgroundColor: segBg, alignItems: 'center', justifyContent: 'center',
                                    borderWidth: 1.5, borderColor: borderCol,
                                    borderStyle: 'dashed',
                                }}
                            >
                                {customIconUri
                                    ? <Image source={{ uri: customIconUri }} style={{ width: 58, height: 58, borderRadius: 14 }} />
                                    : customIconName
                                        ? <Ionicons name={customIconName} size={30} color={customIconColor} />
                                        : <Ionicons name="camera-outline" size={30} color={textSub} />
                                }
                            </Pressable>
                            <Text style={{ fontSize: 12, color: textSub, marginTop: 8 }}>
                                {(customIconUri || customIconName) ? t('billing.change_icon') : t('billing.upload_icon')}
                            </Text>
                        </View>

                        <Text style={{ fontSize: 12, color: textSub, fontWeight: '600', marginBottom: 10 }}>
                            {t('billing.method_name')}
                        </Text>
                        <View style={{ backgroundColor: segBg, borderRadius: 12, paddingHorizontal: 16, marginBottom: 24 }}>
                            <TextInput
                                key="name-custom"
                                value={customLabel}
                                onChangeText={setCustomLabel}
                                placeholder={t('billing.method_name_placeholder')}
                                placeholderTextColor={textSub}
                                autoCapitalize="words"
                                autoCorrect={false}
                                style={{
                                    ...singleLineTextInputStyle,
                                    height: 48, fontSize: 16, fontWeight: '400',
                                    letterSpacing: 0, textAlign: 'left', color: textPrimary,
                                }}
                            />
                        </View>

                        <Text style={{ fontSize: 12, color: textSub, fontWeight: '600', marginBottom: 10 }}>
                            {t('billing.memo')}
                        </Text>
                        <View style={{ backgroundColor: segBg, borderRadius: 12, paddingHorizontal: 16, marginBottom: 24 }}>
                            <TextInput
                                key="memo-custom"
                                value={customMemo}
                                onChangeText={setCustomMemo}
                                placeholder={t('billing.memo_placeholder')}
                                placeholderTextColor={textSub}
                                autoCapitalize="none"
                                autoCorrect={false}
                                style={{
                                    ...singleLineTextInputStyle,
                                    height: 48, fontSize: 16, fontWeight: '400',
                                    letterSpacing: 0, textAlign: 'left', color: textPrimary,
                                }}
                            />
                        </View>

                        <Pressable
                            onPress={handleAddCustom}
                            disabled={!customLabel.trim()}
                            style={{
                                backgroundColor: customLabel.trim() ? '#3B82F6' : segBg,
                                borderRadius: 14, paddingVertical: 16, alignItems: 'center',
                            }}
                        >
                            <Text style={{ fontSize: 16, fontWeight: '700', color: customLabel.trim() ? '#fff' : textSub }}>
                                {t('billing.add_button')}
                            </Text>
                        </Pressable>
                    </View>
                )}
            </ScrollView>

            <IconSourceSheet
                visible={showIconSourceSheet}
                isDark={isDark}
                onClose={() => setShowIconSourceSheet(false)}
                onSelect={(option) => {
                    if (option === 'library') setShowIconPresetModal(true);
                    else void pickIcon(option);
                }}
            />
            <Modal
                transparent
                animationType="fade"
                visible={showIconPresetModal}
                onRequestClose={() => setShowIconPresetModal(false)}
            >
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.45)' }}>
                    <Pressable
                        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                        onPress={() => setShowIconPresetModal(false)}
                    />

                    <View
                        style={{
                            width: ICON_PICKER_WIDTH,
                            borderRadius: 16,
                            backgroundColor: bg,
                            paddingHorizontal: 14,
                            paddingTop: 14,
                            paddingBottom: 12,
                        }}
                    >
                        <Text style={{ fontSize: 16, fontWeight: '700', color: textPrimary, marginBottom: 12 }}>
                            {t('billing.pick_icon_title')}
                        </Text>

                        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                            {CUSTOM_ICON_PRESETS.map((icon, index) => (
                                <Pressable
                                    key={icon.id}
                                    onPress={() => handleSelectPresetIcon(icon.iconName, icon.color)}
                                    style={{
                                        width: ICON_PICKER_TILE_SIZE,
                                        height: ICON_PICKER_TILE_SIZE,
                                        borderRadius: 12,
                                        backgroundColor: segBg,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        borderWidth: 1,
                                        borderColor: borderCol,
                                        marginRight: index % 3 === 2 ? 0 : ICON_PICKER_GAP,
                                        marginBottom: ICON_PICKER_GAP,
                                    }}
                                >
                                    <Ionicons name={icon.iconName} size={24} color={icon.color} />
                                </Pressable>
                            ))}
                        </View>

                        <Pressable
                            onPress={() => setShowIconPresetModal(false)}
                            style={{ marginTop: 12, alignItems: 'center', paddingVertical: 8 }}
                        >
                            <Text style={{ color: '#3B82F6', fontSize: 14, fontWeight: '600' }}>
                                {t('billing.cancel')}
                            </Text>
                        </Pressable>
                    </View>
                </View>
            </Modal>
        </KeyboardAvoidingView>
    );
}
