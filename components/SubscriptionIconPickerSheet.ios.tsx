import React from 'react';
import { Dimensions, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';

import { SUBSCRIPTION_ICON_PRESETS } from '../lib/subscriptionIcon';
import type { SubscriptionIconPickerSheetProps } from './SubscriptionIconPickerSheet.types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ICON_PICKER_WIDTH = Math.min(SCREEN_WIDTH - 32, 360);
const ICON_PICKER_GAP = 10;
const ICON_PICKER_TILE_SIZE = Math.floor((ICON_PICKER_WIDTH - 28 - ICON_PICKER_GAP * 2) / 3);

export default function SubscriptionIconPickerSheet({
    visible,
    isDark,
    title,
    cancelLabel,
    comingSoonMessage,
    onClose,
    onSelect,
}: SubscriptionIconPickerSheetProps) {
    return (
        <Modal
            transparent
            animationType="fade"
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.45)' }}>
                <Pressable
                    style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                    onPress={onClose}
                />

                <View
                    style={{
                        width: ICON_PICKER_WIDTH,
                        borderRadius: 16,
                        backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
                        paddingHorizontal: 14,
                        paddingTop: 14,
                        paddingBottom: 12,
                        maxHeight: '72%',
                    }}
                >
                    <Text style={{ fontSize: 16, fontWeight: '700', color: isDark ? '#FFFFFF' : '#111827' }}>
                        {title}
                    </Text>
                    <Text
                        style={{
                            color: isDark ? '#8E8E93' : '#6B7280',
                            fontSize: 13,
                            lineHeight: 18,
                            marginTop: 4,
                            marginBottom: 12,
                        }}
                    >
                        {comingSoonMessage}
                    </Text>

                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 4 }}>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                            {SUBSCRIPTION_ICON_PRESETS.map((icon, index) => (
                                <Pressable
                                    key={icon.id}
                                    accessibilityLabel={icon.label}
                                    onPress={() => onSelect(icon)}
                                    style={{
                                        width: ICON_PICKER_TILE_SIZE,
                                        height: ICON_PICKER_TILE_SIZE,
                                        borderRadius: 12,
                                        backgroundColor: isDark ? '#2C2C2E' : '#F3F4F6',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        borderWidth: 1,
                                        borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                                        marginRight: index % 3 === 2 ? 0 : ICON_PICKER_GAP,
                                        marginBottom: ICON_PICKER_GAP,
                                    }}
                                >
                                    {icon.pack === 'fontawesome5' ? (
                                        <FontAwesome5 name={icon.name} size={24} color={icon.color} />
                                    ) : (
                                        <Ionicons name={icon.name} size={24} color={icon.color} />
                                    )}
                                </Pressable>
                            ))}
                        </View>
                    </ScrollView>

                    <Pressable onPress={onClose} style={{ marginTop: 10, alignItems: 'center', paddingVertical: 8 }}>
                        <Text style={{ color: '#3B82F6', fontSize: 14, fontWeight: '600' }}>
                            {cancelLabel}
                        </Text>
                    </Pressable>
                </View>
            </View>
        </Modal>
    );
}
