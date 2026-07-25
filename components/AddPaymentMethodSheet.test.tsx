import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { describe, expect, jest, test } from '@jest/globals';
import { StyleSheet } from 'react-native';

import { AddPaymentMethodSheet } from './AddPaymentMethodSheet';

jest.mock('@expo/vector-icons', () => ({
    Ionicons: () => null,
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
    test('resets native text styles and capitalization for every free-text input', async () => {
        const screen = await render(
            <AddPaymentMethodSheet visible onClose={jest.fn()} />
        );

        await fireEvent.press(screen.getByText('Custom'));

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

        await fireEvent.press(screen.getByText('Brand'));
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

        await fireEvent.press(screen.getByText('Card'));

        const cardMemo = screen.getByPlaceholderText('e.g. example@example.com, Main Account');
        expect(StyleSheet.flatten(cardMemo.props.style)).toEqual(expect.objectContaining({
            fontSize: 16,
            fontWeight: '400',
            letterSpacing: 0,
            textAlign: 'left',
        }));
        expect(cardMemo.props.autoCapitalize).toBe('none');
        expect(cardMemo.props.autoCorrect).toBe(false);
    });
});
