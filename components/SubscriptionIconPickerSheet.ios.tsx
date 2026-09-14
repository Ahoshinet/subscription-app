import React from 'react';
import { Dimensions } from 'react-native';
import type { SFSymbol } from 'sf-symbols-typescript';
import {
    BottomSheet,
    Button,
    Grid,
    Group,
    Host,
    Image,
    ScrollView,
    Text,
    VStack,
} from '@expo/ui/swift-ui';
import {
    accessibilityLabel,
    buttonBorderShape,
    buttonStyle,
    font,
    frame,
    padding,
    presentationDetents,
    presentationDragIndicator,
    tint,
} from '@expo/ui/swift-ui/modifiers';

import { SUBSCRIPTION_ICON_PRESETS } from '../lib/subscriptionIcon';
import type { SubscriptionIconPickerSheetProps } from './SubscriptionIconPickerSheet.types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
// The native bordered button adds its own system padding around this label frame.
const GRID_LABEL_SIZE = Math.max(48, Math.min(72, Math.floor((SCREEN_WIDTH - 140) / 3)));
const GRID_SCROLL_HEIGHT = Math.max(360, Math.min(650, SCREEN_HEIGHT - 220));

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

const iconRows = Array.from(
    { length: Math.ceil(SUBSCRIPTION_ICON_PRESETS.length / 3) },
    (_, index) => SUBSCRIPTION_ICON_PRESETS.slice(index * 3, index * 3 + 3),
);

export default function SubscriptionIconPickerSheet({
    visible,
    isDark,
    title,
    cancelLabel,
    onClose,
    onSelect,
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
                <Group modifiers={[
                    presentationDetents(['medium', 'large'], { selection: 'large' }),
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
                                                onPress={() => onSelect(icon)}
                                                modifiers={[
                                                    accessibilityLabel(icon.label),
                                                    buttonStyle('bordered'),
                                                    buttonBorderShape('roundedRectangle', 12),
                                                    tint(icon.color),
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

                        <Button
                            label={cancelLabel}
                            role="cancel"
                            onPress={onClose}
                            modifiers={[buttonStyle('borderless'), frame({ maxWidth: 10_000 })]}
                        />
                    </VStack>
                </Group>
            </BottomSheet>
        </Host>
    );
}
