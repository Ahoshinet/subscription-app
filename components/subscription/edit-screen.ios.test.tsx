import { describe, expect, jest, test } from '@jest/globals';
import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';
import { StyleSheet } from 'react-native';

import EditSubscriptionScreen from './edit-screen.ios';

const mockPush = jest.fn();
const mockBack = jest.fn();
let capturedScreenOptions: Record<string, unknown> | undefined;
const symbolNames: string[] = [];

jest.mock('expo-router', () => ({
  Stack: {
    Screen: ({ options }: { options: Record<string, unknown> }) => {
      capturedScreenOptions = options;
      return null;
    },
  },
  useRouter: () => ({ push: mockPush, back: mockBack }),
  useNavigation: () => ({
    addListener: () => jest.fn(),
    dispatch: jest.fn(),
  }),
  useLocalSearchParams: () => ({ id: '7' }),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('expo-symbols', () => ({
  SymbolView: ({ name }: { name: string }) => {
    symbolNames.push(name);
    return null;
  },
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: () => null,
  FontAwesome5: () => null,
}));

jest.mock('@react-native-community/datetimepicker', () => () => null);

jest.mock('@/hooks/use-color-scheme', () => ({
  useColorScheme: () => 'dark',
}));

jest.mock('@/lib/api', () => ({
  resolveIconUrl: (uri: string) => uri,
  uploadApi: { uploadIcon: jest.fn(), deletePending: jest.fn() },
}));

jest.mock('@/lib/iconPicker', () => ({
  InvalidIconImageError: class extends Error {},
  pickIconImage: jest.fn(),
}));

jest.mock('@/lib/imageCropStore', () => ({
  setCropHandler: jest.fn(),
}));

jest.mock('@/components/IconSourceSheet', () => () => null);
jest.mock('@/components/SubscriptionIconPickerSheet', () => () => null);

jest.mock('@/store/useSubscriptionStore', () => ({
  useSubscriptionStore: () => ({
    subscriptions: [
      {
        id: 7,
        service_name: 'Claude',
        plan_name: 'Pro',
        amount: 3000,
        currency: 'JPY',
        billing_cycle: 'monthly',
        payment_method: 'app_store',
        next_payment_date: '2026-10-14',
        status: 'active',
        icon_url: '/uploads/claude.png',
        memo: '',
      },
    ],
    updateSubscription: jest.fn(),
  }),
}));

jest.mock('@/store/useAddFormStore', () => ({
  useAddFormStore: () => ({
    billingCycle: 'monthly',
    paymentMethod: 'app_store',
    currency: 'JPY',
    setBillingCycle: jest.fn(),
    setPaymentMethod: jest.fn(),
    setCurrency: jest.fn(),
  }),
}));

jest.mock('@/store/usePaymentMethodStore', () => ({
  usePaymentMethodStore: () => ({
    methods: [{ id: 'app_store', label: 'App Store' }],
  }),
}));

describe('iOS edit subscription sheet', () => {
  test('uses the native header, layered palette, and SF Symbol chevrons', async () => {
    symbolNames.length = 0;
    const screen = await render(<EditSubscriptionScreen />);

    expect(capturedScreenOptions).toEqual(expect.objectContaining({
      headerShadowVisible: false,
      headerStyle: { backgroundColor: '#1C1C1E' },
    }));
    expect(typeof capturedScreenOptions?.unstable_headerLeftItems).toBe('function');
    expect(typeof capturedScreenOptions?.unstable_headerRightItems).toBe('function');
    expect(capturedScreenOptions?.headerLeft).toBeUndefined();

    const card = screen.getByTestId('ios-edit-basics-card');
    const cardStyle = StyleSheet.flatten(card.props.style);
    expect(cardStyle).toEqual(expect.objectContaining({
      backgroundColor: '#2C2C2E',
      borderRadius: 16,
    }));
    expect(cardStyle.borderWidth).toBeUndefined();

    expect(symbolNames).toContain('chevron.right');
    expect(screen.getByDisplayValue('Claude')).toBeTruthy();
    await screen.unmount();
  });

  test('navigates to the shared pickers from the payment rows', async () => {
    const screen = await render(<EditSubscriptionScreen />);

    await fireEvent.press(screen.getByTestId('ios-edit-billing-cycle-row'));
    expect(mockPush).toHaveBeenCalledWith('/settings/billing-cycle');

    await fireEvent.press(screen.getByTestId('ios-edit-payment-method-row'));
    expect(mockPush).toHaveBeenCalledWith('/settings/payment-method');

    await fireEvent.press(screen.getByTestId('ios-edit-currency-row'));
    expect(mockPush).toHaveBeenCalledWith('/settings/currency-picker');
    await screen.unmount();
  });
});
