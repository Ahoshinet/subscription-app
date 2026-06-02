import React, { useRef, useEffect, useState } from 'react';
import {
    Modal, View, Text, Pressable, Animated,
    ScrollView, TextInput, Image, useColorScheme,
    Platform, Dimensions, KeyboardAvoidingView, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import * as ImagePicker from 'expo-image-picker';
import { usePaymentMethodStore } from '@/store/usePaymentMethodStore';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');
const SHEET_HORIZONTAL_PADDING = 20;
const BRAND_GRID_GAP = 10;
const BRAND_TILE_SIZE = Math.floor(
    (SCREEN_WIDTH - SHEET_HORIZONTAL_PADDING * 2 - BRAND_GRID_GAP * 2) / 3
);
const ICON_PICKER_WIDTH = Math.min(SCREEN_WIDTH - 32, 340);
const ICON_PICKER_GAP = 10;
const ICON_PICKER_TILE_SIZE = Math.floor((ICON_PICKER_WIDTH - 28 - ICON_PICKER_GAP * 2) / 3);

export const PRESET_BRANDS = [
    { id: 'paypal',       label: 'PayPal',         iconName: 'logo-paypal',  color: '#003087' },
    { id: 'apple-pay',    label: 'Apple Pay',       iconName: 'logo-apple',   color: '#000000' },
    { id: 'app-store',    label: 'App Store決済',   iconName: 'logo-apple',   color: '#0D84F1' },
    { id: 'google-pay',   label: 'Google Pay',      iconName: 'logo-google',  color: '#4285F4' },
    { id: 'google-play',  label: 'Google Play決済', iconName: 'logo-google',  color: '#01875F' },
    { id: 'paidy',        label: 'Paidy',           iconName: 'card-outline', color: '#6C47FF' },
    { id: 'amazon-pay',   label: 'Amazon Pay',      iconName: 'cart-outline', color: '#FF9900' },
] as const;

const CARD_BRANDS = ['Visa', 'Mastercard', 'JCB', 'Amex', 'その他'];

const CUSTOM_ICON_PRESETS = [
    { id: 'wallet', iconName: 'wallet-outline', color: '#6B7280' },
    { id: 'card', iconName: 'card-outline', color: '#6B7280' },
    { id: 'cash', iconName: 'cash-outline', color: '#22C55E' },
    { id: 'shopping', iconName: 'cart-outline', color: '#F59E0B' },
    { id: 'streaming', iconName: 'play-circle-outline', color: '#EF4444' },
    { id: 'game', iconName: 'game-controller-outline', color: '#8B5CF6' },
    { id: 'paypal', iconName: 'logo-paypal', color: '#003087' },
    { id: 'apple', iconName: 'logo-apple', color: '#111827' },
    { id: 'google', iconName: 'logo-google', color: '#4285F4' },
] as const;

interface Props {
    visible: boolean;
    onClose: () => void;
}

export function AddPaymentMethodSheet({ visible, onClose }: Props) {
    'use no memo';
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const { t } = useTranslation();
    const { addMethod } = usePaymentMethodStore();

    const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
    const backdropOpacity = useRef(new Animated.Value(0)).current;

    const [section, setSection] = useState<'brand' | 'card' | 'custom'>('brand');
    const [cardBrand, setCardBrand] = useState('Visa');
    const [cardLast4, setCardLast4] = useState('');
    const [customLabel, setCustomLabel] = useState('');
    const [customIconUri, setCustomIconUri] = useState<string | null>(null);
    const [customIconName, setCustomIconName] = useState<string | null>(null);
    const [customIconColor, setCustomIconColor] = useState('#6B7280');
    const [showIconPresetModal, setShowIconPresetModal] = useState(false);

    // Brand label step
    const [selectedBrand, setSelectedBrand] = useState<(typeof PRESET_BRANDS)[number] | null>(null);
    const [brandMemo, setBrandMemo] = useState('');
    const [cardMemo, setCardMemo] = useState('');
    const [customMemo, setCustomMemo] = useState('');

    useEffect(() => {
        if (visible) {
            translateY.setValue(SCREEN_HEIGHT);
            backdropOpacity.setValue(0);
            Animated.parallel([
                Animated.spring(translateY, {
                    toValue: 0,
                    damping: 22,
                    stiffness: 280,
                    useNativeDriver: true,
                }),
                Animated.timing(backdropOpacity, {
                    toValue: 1,
                    duration: 180,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [visible]);

    const close = () => {
        Animated.parallel([
            Animated.timing(translateY, {
                toValue: SCREEN_HEIGHT,
                duration: 240,
                useNativeDriver: true,
            }),
            Animated.timing(backdropOpacity, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }),
        ]).start(() => {
            setSection('brand');
            setCardLast4('');
            setCustomLabel('');
            setCustomIconUri(null);
            setCustomIconName(null);
            setCustomIconColor('#6B7280');
            setShowIconPresetModal(false);
            setSelectedBrand(null);
            setBrandMemo('');
            setCardMemo('');
            setCustomMemo('');
            onClose();
        });
    };

    const handleSelectBrand = (brand: (typeof PRESET_BRANDS)[number]) => {
        setSelectedBrand(brand);
        setBrandMemo('');
    };

    const handleConfirmBrand = async () => {
        if (!selectedBrand) return;
        close();
        try {
            await addMethod({
                type: 'preset',
                label: selectedBrand.label,
                memo: brandMemo.trim() || undefined,
                iconName: selectedBrand.iconName,
                color: selectedBrand.color,
            });
        } catch {
            Alert.alert(t('common.error'), t('billing.add_failed'));
        }
    };

    const handleAddCard = async () => {
        if (cardLast4.length !== 4) return;
        close();
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
        } catch {
            Alert.alert(t('common.error'), t('billing.add_failed'));
        }
    };

    const handleAddCustom = async () => {
        if (!customLabel.trim()) return;
        close();
        try {
            await addMethod({
                type: 'custom',
                label: customLabel.trim(),
                memo: customMemo.trim() || undefined,
                iconUri: customIconUri ?? undefined,
                iconName: customIconUri ? undefined : (customIconName ?? 'wallet-outline'),
                color: customIconColor,
            });
        } catch {
            Alert.alert(t('common.error'), t('billing.add_failed'));
        }
    };

    const pickIcon = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });
        if (!result.canceled && result.assets[0]) {
            setCustomIconUri(result.assets[0].uri);
            setCustomIconName(null);
            setCustomIconColor('#6B7280');
        }
    };

    const handleSelectPresetIcon = (iconName: string, color: string) => {
        setCustomIconUri(null);
        setCustomIconName(iconName);
        setCustomIconColor(color);
        setShowIconPresetModal(false);
    };

    const openIconSourcePicker = () => {
        Alert.alert(
            t('billing.icon_source_title'),
            t('billing.icon_source_message'),
            [
                { text: t('billing.cancel'), style: 'cancel' },
                { text: t('billing.icon_source_upload'), onPress: () => { void pickIcon(); } },
                { text: t('billing.icon_source_library'), onPress: () => setShowIconPresetModal(true) },
            ]
        );
    };

    if (!visible) return null;

    const bg = isDark ? '#1C1C1E' : '#FFFFFF';
    const segBg = isDark ? '#2C2C2E' : '#F2F2F7';
    const textPrimary = isDark ? '#FFFFFF' : '#000000';
    const textSub = isDark ? '#8E8E93' : '#6B7280';
    const borderCol = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';

    const tabs: { key: 'brand' | 'card' | 'custom'; label: string }[] = [
        { key: 'brand',  label: t('billing.tab_brand') },
        { key: 'card',   label: t('billing.tab_card') },
        { key: 'custom', label: t('billing.tab_custom') },
    ];

    return (
        <Modal
            transparent
            animationType="none"
            visible
            statusBarTranslucent
            onRequestClose={close}
        >
            <KeyboardAvoidingView
                style={{ flex: 1, justifyContent: 'flex-end' }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                {/* Backdrop */}
                <Animated.View
                    style={{
                        position: 'absolute',
                        top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        opacity: backdropOpacity,
                    }}
                >
                    <Pressable style={{ flex: 1 }} onPress={close} />
                </Animated.View>

                {/* Sheet */}
                <Animated.View
                    style={{
                        backgroundColor: bg,
                        borderTopLeftRadius: 22,
                        borderTopRightRadius: 22,
                        maxHeight: SCREEN_HEIGHT * 0.82,
                        transform: [{ translateY }],
                    }}
                >
                    {/* Handle */}
                    <View style={{ alignItems: 'center', paddingTop: 10 }}>
                        <View
                            style={{
                                width: 38, height: 4, borderRadius: 2,
                                backgroundColor: textSub, opacity: 0.35,
                            }}
                        />
                    </View>

                    {/* Title row */}
                    <View
                        style={{
                            flexDirection: 'row', alignItems: 'center',
                            justifyContent: 'space-between',
                            paddingHorizontal: 20, paddingTop: 12, paddingBottom: 14,
                        }}
                    >
                        <Text style={{ fontSize: 18, fontWeight: '700', color: textPrimary }}>
                            {t('billing.add_method_title')}
                        </Text>
                        <Pressable onPress={close} hitSlop={10}>
                            <Ionicons name="close-circle" size={26} color={textSub} />
                        </Pressable>
                    </View>

                    {/* Segmented control */}
                    <View
                        style={{
                            flexDirection: 'row', marginHorizontal: 20,
                            backgroundColor: segBg, borderRadius: 10,
                            padding: 3, marginBottom: 18,
                        }}
                    >
                        {tabs.map(({ key, label }) => (
                            <Pressable
                                key={key}
                                onPress={() => { setSection(key); setSelectedBrand(null); setBrandMemo(''); }}
                                style={{
                                    flex: 1, paddingVertical: 7, borderRadius: 8, alignItems: 'center',
                                    backgroundColor: section === key ? bg : 'transparent',
                                }}
                            >
                                <Text
                                    style={{
                                        fontSize: 13,
                                        fontWeight: section === key ? '600' : '400',
                                        color: section === key ? textPrimary : textSub,
                                    }}
                                >
                                    {label}
                                </Text>
                            </Pressable>
                        ))}
                    </View>

                    <ScrollView
                        style={{ paddingHorizontal: 20 }}
                        contentContainerStyle={{ paddingBottom: Platform.OS === 'ios' ? 44 : 24 }}
                        keyboardShouldPersistTaps="handled"
                        keyboardDismissMode="on-drag"
                        showsVerticalScrollIndicator={false}
                    >
                        {/* ── Brand ── */}
                        {section === 'brand' && !selectedBrand && (
                            <View
                                style={{
                                    flexDirection: 'row',
                                    flexWrap: 'wrap',
                                    justifyContent: 'space-between',
                                    rowGap: BRAND_GRID_GAP,
                                }}
                            >
                                {PRESET_BRANDS.map((brand) => (
                                    <Pressable
                                        key={brand.id}
                                        onPress={() => handleSelectBrand(brand)}
                                        style={{
                                            width: BRAND_TILE_SIZE,
                                            height: BRAND_TILE_SIZE,
                                            borderRadius: 16,
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            backgroundColor: `${brand.color}15`,
                                            borderWidth: 1.5,
                                            borderColor: borderCol,
                                            paddingHorizontal: 8,
                                            paddingTop: 12,
                                            paddingBottom: 12,
                                        }}
                                    >
                                        <View
                                            style={{
                                                flex: 1,
                                                width: '100%',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}
                                        >
                                            <Ionicons name={brand.iconName as any} size={30} color={brand.color} />
                                        </View>
                                        <Text
                                            numberOfLines={1}
                                            adjustsFontSizeToFit
                                            minimumFontScale={0.78}
                                            style={{
                                                fontSize: 10,
                                                lineHeight: 13,
                                                color: textSub,
                                                fontWeight: '500',
                                                textAlign: 'center',
                                                width: '100%',
                                                marginTop: 8,
                                            }}
                                        >
                                            {brand.label}
                                        </Text>
                                    </Pressable>
                                ))}
                            </View>
                        )}

                        {/* ── Brand Label Step ── */}
                        {section === 'brand' && selectedBrand && (
                            <View>
                                <Pressable
                                    onPress={() => { setSelectedBrand(null); setBrandMemo(''); }}
                                    style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}
                                >
                                    <Ionicons name="chevron-back" size={18} color={textSub} />
                                    <Text style={{ fontSize: 14, color: textSub, marginLeft: 4 }}>
                                        {t('billing.back_to_brands')}
                                    </Text>
                                </Pressable>

                                <View style={{ alignItems: 'center', marginBottom: 8 }}>
                                    <View
                                        style={{
                                            width: 60, height: 60, borderRadius: 16,
                                            backgroundColor: `${selectedBrand.color}15`,
                                            alignItems: 'center', justifyContent: 'center',
                                            marginBottom: 10,
                                        }}
                                    >
                                        <Ionicons name={selectedBrand.iconName as any} size={30} color={selectedBrand.color} />
                                    </View>
                                    <Text style={{ fontSize: 18, fontWeight: '700', color: textPrimary }}>
                                        {selectedBrand.label}
                                    </Text>
                                </View>

                                <View style={{ height: 1, backgroundColor: borderCol, marginBottom: 24 }} />

                                <Text
                                    style={{
                                        fontSize: 12, color: textSub, fontWeight: '600',
                                        textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10,
                                    }}
                                >
                                    {t('billing.memo')}
                                </Text>
                                <View
                                    style={{
                                        backgroundColor: segBg, borderRadius: 12,
                                        paddingHorizontal: 16, marginBottom: 24,
                                    }}
                                >
                                    <TextInput
                                        key={`memo-brand-${selectedBrand?.id}`}
                                        value={brandMemo}
                                        onChangeText={setBrandMemo}
                                        placeholder={t('billing.memo_placeholder')}
                                        placeholderTextColor={textSub}
                                        style={{ fontSize: 16, color: textPrimary, paddingVertical: 14 }}
                                    />
                                </View>

                                <Pressable
                                    onPress={handleConfirmBrand}
                                    style={{
                                        backgroundColor: '#3B82F6',
                                        borderRadius: 14, paddingVertical: 16, alignItems: 'center',
                                    }}
                                >
                                    <Text style={{ fontSize: 16, fontWeight: '700', color: '#fff' }}>
                                        {t('billing.add_button')}
                                    </Text>
                                </Pressable>
                            </View>
                        )}

                        {/* ── Card ── */}
                        {section === 'card' && (
                            <View>
                                <Text
                                    style={{
                                        fontSize: 12, color: textSub, fontWeight: '600',
                                        textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10,
                                    }}
                                >
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
                                            <Text
                                                style={{
                                                    fontSize: 14, fontWeight: '500',
                                                    color: cardBrand === b ? '#fff' : textPrimary,
                                                }}
                                            >
                                                {b}
                                            </Text>
                                        </Pressable>
                                    ))}
                                </View>

                                <Text
                                    style={{
                                        fontSize: 12, color: textSub, fontWeight: '600',
                                        textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10,
                                    }}
                                >
                                    {t('billing.card_last4')}
                                </Text>
                                <View
                                    style={{
                                        backgroundColor: segBg, borderRadius: 12,
                                        paddingHorizontal: 16, marginBottom: 24,
                                    }}
                                >
                                    <TextInput
                                        value={cardLast4}
                                        onChangeText={(v) => setCardLast4(v.replace(/\D/g, '').slice(0, 4))}
                                        placeholder="0000"
                                        placeholderTextColor={textSub}
                                        keyboardType="numeric"
                                        maxLength={4}
                                        style={{
                                            fontSize: 28, fontWeight: '700',
                                            letterSpacing: 10, color: textPrimary,
                                            paddingVertical: 14, textAlign: 'center',
                                        }}
                                    />
                                </View>

                                <Text
                                    style={{
                                        fontSize: 12, color: textSub, fontWeight: '600',
                                        textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10,
                                    }}
                                >
                                    {t('billing.memo')}
                                </Text>
                                <View
                                    style={{
                                        backgroundColor: segBg, borderRadius: 12,
                                        paddingHorizontal: 16, marginBottom: 24,
                                    }}
                                >
                                    <TextInput
                                        key="memo-card"
                                        value={cardMemo}
                                        onChangeText={setCardMemo}
                                        placeholder={t('billing.memo_placeholder')}
                                        placeholderTextColor={textSub}
                                        style={{ fontSize: 16, color: textPrimary, paddingVertical: 14 }}
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
                                    <Text
                                        style={{
                                            fontSize: 16, fontWeight: '700',
                                            color: cardLast4.length === 4 ? '#fff' : textSub,
                                        }}
                                    >
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
                                                ? <Ionicons name={customIconName as any} size={30} color={customIconColor} />
                                                : <Ionicons name="camera-outline" size={30} color={textSub} />
                                        }
                                    </Pressable>
                                    <Text style={{ fontSize: 12, color: textSub, marginTop: 8 }}>
                                        {(customIconUri || customIconName) ? t('billing.change_icon') : t('billing.upload_icon')}
                                    </Text>
                                </View>

                                <Text
                                    style={{
                                        fontSize: 12, color: textSub, fontWeight: '600',
                                        textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10,
                                    }}
                                >
                                    {t('billing.method_name')}
                                </Text>
                                <View
                                    style={{
                                        backgroundColor: segBg, borderRadius: 12,
                                        paddingHorizontal: 16, marginBottom: 24,
                                    }}
                                >
                                    <TextInput
                                        value={customLabel}
                                        onChangeText={setCustomLabel}
                                        placeholder={t('billing.method_name_placeholder')}
                                        placeholderTextColor={textSub}
                                        style={{ fontSize: 16, color: textPrimary, paddingVertical: 14 }}
                                    />
                                </View>

                                <Text
                                    style={{
                                        fontSize: 12, color: textSub, fontWeight: '600',
                                        textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10,
                                    }}
                                >
                                    {t('billing.memo')}
                                </Text>
                                <View
                                    style={{
                                        backgroundColor: segBg, borderRadius: 12,
                                        paddingHorizontal: 16, marginBottom: 24,
                                    }}
                                >
                                    <TextInput
                                        key="memo-custom"
                                        value={customMemo}
                                        onChangeText={setCustomMemo}
                                        placeholder={t('billing.memo_placeholder')}
                                        placeholderTextColor={textSub}
                                        style={{ fontSize: 16, color: textPrimary, paddingVertical: 14 }}
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
                                    <Text
                                        style={{
                                            fontSize: 16, fontWeight: '700',
                                            color: customLabel.trim() ? '#fff' : textSub,
                                        }}
                                    >
                                        {t('billing.add_button')}
                                    </Text>
                                </Pressable>
                            </View>
                        )}
                    </ScrollView>
                </Animated.View>
            </KeyboardAvoidingView>

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
                                    <Ionicons name={icon.iconName as any} size={24} color={icon.color} />
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
        </Modal>
    );
}
