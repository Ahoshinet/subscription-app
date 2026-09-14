import React, { useState } from 'react';
import { Dimensions } from 'react-native';
import type { SFSymbol } from 'sf-symbols-typescript';
import {
    BottomSheet,
    Button,
    ColorPicker,
    Grid,
    Group,
    HStack,
    Host,
    Image,
    Picker,
    ScrollView,
    Spacer,
    Text,
    VStack,
} from '@expo/ui/swift-ui';
import {
    accessibilityLabel,
    buttonBorderShape,
    buttonStyle,
    disabled,
    font,
    frame,
    padding,
    pickerStyle,
    presentationDetents,
    presentationDragIndicator,
    tag,
    tint,
} from '@expo/ui/swift-ui/modifiers';

import {
    SUBSCRIPTION_ICON_PRESETS,
    type SubscriptionIconCategory,
    type SubscriptionIconSelection,
} from '../lib/subscriptionIcon';
import type { SubscriptionIconPickerSheetProps } from './SubscriptionIconPickerSheet.types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
// The native bordered button adds its own system padding around this label frame.
const GRID_LABEL_SIZE = Math.max(48, Math.min(72, Math.floor((SCREEN_WIDTH - 140) / 3)));
const GRID_SCROLL_HEIGHT = Math.max(260, Math.min(520, SCREEN_HEIGHT - 340));
const DEFAULT_ACCENT_COLOR = '#3B82F6';

type IconCategoryFilter = 'all' | SubscriptionIconCategory;

// Presentation-only mapping. Selection still returns the original v1-compatible
// Ionicons/Font Awesome preset, so SF Symbol names never enter persisted data.
const SF_SYMBOLS_BY_PRESET_ID: Record<string, SFSymbol> = {
    cube: 'cube',
    play: 'play.circle',
    tv: 'tv',
    music: 'music.note',
    game: 'gamecontroller',
    book: 'book.closed',
    school: 'graduationcap',
    cloud: 'cloud',
    chat: 'bubble.left.and.bubble.right',
    server: 'externaldrive',
    wallet: 'wallet.pass',
    card: 'creditcard',
    cart: 'cart',
    cafe: 'cup.and.saucer',
    fitness: 'heart.text.square',
    netflix: 'film',
    youtube: 'play.rectangle.fill',
    spotify: 'music.note.list',
    discord: 'bubble.left.and.text.bubble.right',
    twitch: 'play.tv',
    github: 'chevron.left.forwardslash.chevron.right',
    paypal: 'p.circle',
    apple: 'apple.logo',
    google: 'g.circle',
    microsoft: 'square.grid.2x2',
    amazon: 'shippingbox',
    steam: 'gamecontroller.fill',
    visa: 'creditcard.and.123',
    mastercard: 'creditcard.fill',
};

const findPresetId = (selection?: SubscriptionIconSelection | null) =>
    selection
        ? SUBSCRIPTION_ICON_PRESETS.find(
            (preset) => preset.pack === selection.pack && preset.name === selection.name,
        )?.id ?? null
        : null;

type IconPickerSheetContentProps = Omit<SubscriptionIconPickerSheetProps, 'visible' | 'onClose'> & {
    onCancel: () => void;
};

function IconPickerSheetContent({
    isDark,
    title,
    cancelLabel,
    doneLabel,
    colorLabel,
    categoryLabels,
    initialIcon,
    onCancel,
    onSelect,
}: IconPickerSheetContentProps) {
    const [category, setCategory] = useState<IconCategoryFilter>('all');
    const [selectedPresetId, setSelectedPresetId] = useState<string | null>(() => findPresetId(initialIcon));
    const [accentColor, setAccentColor] = useState(() => initialIcon?.color ?? DEFAULT_ACCENT_COLOR);

    const filteredIcons = category === 'all'
        ? SUBSCRIPTION_ICON_PRESETS
        : SUBSCRIPTION_ICON_PRESETS.filter((icon) => icon.category === category);
    const iconRows = Array.from(
        { length: Math.ceil(filteredIcons.length / 3) },
        (_, index) => filteredIcons.slice(index * 3, index * 3 + 3),
    );

    const handleDone = () => {
        const preset = SUBSCRIPTION_ICON_PRESETS.find((icon) => icon.id === selectedPresetId);
        if (!preset) return;

        const selection: SubscriptionIconSelection = preset.pack === 'fontawesome5'
            ? { pack: 'fontawesome5', name: preset.name, color: accentColor }
            : { pack: 'ionicons', name: preset.name, color: accentColor };
        onSelect(selection);
    };

    const monochromeTint = isDark ? '#D1D1D6' : '#3A3A3C';

    return (
        <Group modifiers={[
            presentationDetents(['large']),
            presentationDragIndicator('visible'),
        ]}>
            <VStack
                alignment="leading"
                spacing={14}
                modifiers={[padding({ top: 18, bottom: 14, horizontal: 16 })]}
            >
                <Text modifiers={[font({ textStyle: 'title3', weight: 'semibold' })]}>
                    {title}
                </Text>

                <Picker<IconCategoryFilter>
                    selection={category}
                    onSelectionChange={(selection) => {
                        if (selection) setCategory(selection);
                    }}
                    modifiers={[pickerStyle('segmented')]}
                >
                    <Text modifiers={[tag('all')]}>{categoryLabels.all}</Text>
                    <Text modifiers={[tag('service')]}>{categoryLabels.service}</Text>
                    <Text modifiers={[tag('content')]}>{categoryLabels.content}</Text>
                    <Text modifiers={[tag('other')]}>{categoryLabels.other}</Text>
                </Picker>

                <ColorPicker
                    label={colorLabel}
                    selection={accentColor}
                    supportsOpacity={false}
                    onSelectionChange={setAccentColor}
                />

                <ScrollView
                    showsIndicators={false}
                    modifiers={[frame({ height: GRID_SCROLL_HEIGHT })]}
                >
                    <Grid
                        horizontalSpacing={10}
                        verticalSpacing={10}
                        modifiers={[frame({ maxWidth: 10_000, alignment: 'center' })]}
                    >
                        {iconRows.map((row, rowIndex) => (
                            <Grid.Row key={`icon-row-${rowIndex}`}>
                                {row.map((icon) => (
                                    <Button
                                        key={icon.id}
                                        onPress={() => setSelectedPresetId(icon.id)}
                                        modifiers={[
                                            accessibilityLabel(icon.label),
                                            buttonStyle(selectedPresetId === icon.id ? 'borderedProminent' : 'bordered'),
                                            buttonBorderShape('roundedRectangle', 12),
                                            tint(selectedPresetId === icon.id ? accentColor : monochromeTint),
                                        ]}
                                    >
                                        <Image
                                            systemName={SF_SYMBOLS_BY_PRESET_ID[icon.id]}
                                            size={25}
                                            modifiers={[frame({ width: GRID_LABEL_SIZE, height: GRID_LABEL_SIZE })]}
                                        />
                                    </Button>
                                ))}
                            </Grid.Row>
                        ))}
                    </Grid>
                </ScrollView>

                <HStack>
                    <Button
                        label={cancelLabel}
                        role="cancel"
                        onPress={onCancel}
                        modifiers={[buttonStyle('borderless')]}
                    />
                    <Spacer />
                    <Button
                        label={doneLabel}
                        onPress={handleDone}
                        modifiers={[
                            buttonStyle('borderedProminent'),
                            disabled(selectedPresetId === null),
                        ]}
                    />
                </HStack>
            </VStack>
        </Group>
    );
}

export default function SubscriptionIconPickerSheet({
    visible,
    isDark,
    onClose,
    ...contentProps
}: SubscriptionIconPickerSheetProps) {
    return (
        <Host
            colorScheme={isDark ? 'dark' : 'light'}
            style={{ position: 'absolute', width: SCREEN_WIDTH }}
            pointerEvents="none"
        >
            <BottomSheet
                isPresented={visible}
                onIsPresentedChange={(isPresented) => {
                    if (!isPresented) onClose();
                }}
                onDismiss={onClose}
            >
                <IconPickerSheetContent
                    {...contentProps}
                    isDark={isDark}
                    onCancel={onClose}
                />
            </BottomSheet>
        </Host>
    );
}
