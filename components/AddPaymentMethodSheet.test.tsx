import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import { describe, expect, jest, test } from '@jest/globals';
import { StyleSheet } from 'react-native';

import { AddPaymentMethodSheet } from './AddPaymentMethodSheet';

jest.mock('@expo/vector-icons', () => ({
    Ionicons: () => null,
}));

jest.mock('@expo/ui/community/segmented-control', () => ({
    __esModule: true,
    default: 'SegmentedControl',
}));

jest.mock('expo-image-picker', () => ({
    launchImageLibraryAsync: jest.fn(),
}));

jest.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string) => ({
            'billing.add_method_title': 'Add Payment Method',
            'billing.tab_brand': 'Brand',
            'billing.tab_card': 'Card',
            'billing.tab_custom': 'Custom',
            'billing.memo': 'Memo (Optional)',
            'billing.memo_placeholder': 'e.g. example@example.com, Main Account',
            'billing.card_brand': 'Card Brand',
            'billing.card_last4': 'Last 4 Digits',
            'billing.method_name': 'Name',
            'billing.method_name_placeholder': 'e.g. My Card',
            'billing.add_button': 'Add',
        })[key] ?? key,
    }),
}));

jest.mock('@/hooks/use-color-scheme', () => ({
    useColorScheme: () => 'light',
}));

jest.mock('@/store/usePaymentMethodStore', () => ({
    usePaymentMethodStore: () => ({
        addMethod: jest.fn(),
    }),
}));

describe('AddPaymentMethodSheet', () => {
    const selectSection = async (
        screen: Awaited<ReturnType<typeof render>>,
        selectedSegmentIndex: number,
        value: string,
    ) => {
        await act(() => {
            screen.getByTestId('payment-method-section-picker').props.onChange({
                nativeEvent: { selectedSegmentIndex, value },
            });
        });
    };

    test('uses the native large sheet and Settings-style brand rows on iOS', async () => {
        const screen = await render(
            <AddPaymentMethodSheet visible onClose={jest.fn()} />
        );

        const modal = screen.getByTestId('add-payment-method-sheet');
        expect(modal.props.presentationStyle).toBe('pageSheet');
        expect(modal.props.allowSwipeDismissal).toBe(true);
        expect(screen.getByTestId('payment-method-section-picker')).toBeTruthy();

        const paypalRow = screen.getByTestId('payment-brand-row-paypal');
        expect(StyleSheet.flatten(paypalRow.props.style)).toEqual(expect.objectContaining({
            minHeight: 58,
            flexDirection: 'row',
            alignItems: 'center',
        }));
    });

    test('resets native text styles and capitalization for every free-text input', async () => {
        const screen = await render(
            <AddPaymentMethodSheet visible onClose={jest.fn()} />
        );

        await selectSection(screen, 2, 'Custom');

        const customName = screen.getByPlaceholderText('e.g. My Card');
        const customMemo = screen.getByPlaceholderText('e.g. example@example.com, Main Account');

        expect(StyleSheet.flatten(customName.props.style)).toEqual(expect.objectContaining({
            fontSize: 16,
            fontWeight: '400',
            letterSpacing: 0,
            textAlign: 'left',
        }));
        expect(customName.props.autoCapitalize).toBe('words');
        expect(customName.props.autoCorrect).toBe(false);

        expect(StyleSheet.flatten(customMemo.props.style)).toEqual(expect.objectContaining({
            fontSize: 16,
            fontWeight: '400',
            letterSpacing: 0,
            textAlign: 'left',
        }));
        expect(customMemo.props.autoCapitalize).toBe('none');
        expect(customMemo.props.autoCorrect).toBe(false);

        await selectSection(screen, 0, 'Brand');
        await fireEvent.press(screen.getByText('PayPal'));

        const brandMemo = screen.getByPlaceholderText('e.g. example@example.com, Main Account');
        expect(StyleSheet.flatten(brandMemo.props.style)).toEqual(expect.objectContaining({
            fontSize: 16,
            fontWeight: '400',
            letterSpacing: 0,
            textAlign: 'left',
        }));
        expect(brandMemo.props.autoCapitalize).toBe('none');
        expect(brandMemo.props.autoCorrect).toBe(false);

        await selectSection(screen, 1, 'Card');

        const cardMemo = screen.getByPlaceholderText('e.g. example@example.com, Main Account');
        expect(StyleSheet.flatten(cardMemo.props.style)).toEqual(expect.objectContaining({
            fontSize: 16,
            fontWeight: '400',
            letterSpacing: 0,
            textAlign: 'left',
        }));
        expect(cardMemo.props.autoCapitalize).toBe('none');
        expect(cardMemo.props.autoCorrect).toBe(false);
    }, 15000);
});
