import React from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import type { IconSourceOption, IconSourceSheetProps } from './IconSourceSheet.types';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const OPTIONS: { id: IconSourceOption; icon: IoniconName; labelKey: string }[] = [
    { id: 'photos', icon: 'images-outline', labelKey: 'billing.icon_source_photos' },
    { id: 'files', icon: 'folder-open-outline', labelKey: 'billing.icon_source_files' },
    { id: 'library', icon: 'apps-outline', labelKey: 'billing.icon_source_library' },
];

// Bottom-sheet picker: RN's Alert is capped at 3 buttons on Android, which is
// too few once "Files" joins "Photo Library" and the built-in icon set.
export default function IconSourceSheet({ visible, isDark, onClose, onSelect }: IconSourceSheetProps) {
    const { t } = useTranslation();
    const textColor = isDark ? '#FFFFFF' : '#111827';
    const subtitleColor = isDark ? '#8E8E93' : '#6B7280';
    const pressedBg = isDark ? '#2C2C2E' : '#F3F4F6';

    return (
        <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
            <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' }}>
                <Pressable style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} onPress={onClose} />

                <View
                    style={{
                        backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
                        borderTopLeftRadius: 20,
                        borderTopRightRadius: 20,
                        paddingHorizontal: 16,
                        paddingTop: 16,
                        paddingBottom: 24,
                    }}
                >
                    <Text style={{ fontSize: 16, fontWeight: '700', color: textColor }}>
                        {t('billing.icon_source_title')}
                    </Text>
                    <Text style={{ fontSize: 13, color: subtitleColor, marginTop: 4, marginBottom: 12 }}>
                        {t('billing.icon_source_message')}
                    </Text>

                    {OPTIONS.map((option) => (
                        <Pressable
                            key={option.id}
                            accessibilityRole="button"
                            onPress={() => {
                                onClose();
                                onSelect(option.id);
                            }}
                            style={({ pressed }) => ({
                                flexDirection: 'row',
                                alignItems: 'center',
                                paddingVertical: 14,
                                paddingHorizontal: 12,
                                borderRadius: 12,
                                backgroundColor: pressed ? pressedBg : 'transparent',
                            })}
                        >
                            <Ionicons name={option.icon} size={22} color={isDark ? '#60A5FA' : '#3B82F6'} />
                            <Text style={{ fontSize: 16, color: textColor, marginLeft: 14 }}>{t(option.labelKey)}</Text>
                        </Pressable>
                    ))}

                    <Pressable
                        accessibilityRole="button"
                        onPress={onClose}
                        style={{
                            marginTop: 8,
                            paddingVertical: 14,
                            borderRadius: 12,
                            alignItems: 'center',
                            backgroundColor: pressedBg,
                        }}
                    >
                        <Text style={{ fontSize: 16, fontWeight: '600', color: textColor }}>{t('billing.cancel')}</Text>
                    </Pressable>
                </View>
            </View>
        </Modal>
    );
}
