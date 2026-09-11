import { describe, expect, jest, test } from '@jest/globals';
import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';
import { StyleSheet } from 'react-native';

import BillingScreen from './billing-screen.ios';

const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  Stack: { Screen: () => null },
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: () => null,
}));

jest.mock('@/hooks/use-color-scheme', () => ({
  useColorScheme: () => 'dark',
}));

jest.mock('@/components/AddPaymentMethodSheet', () => ({
  AddPaymentMethodSheet: () => null,
}));

jest.mock('@/lib/api', () => ({
  resolveIconUrl: (uri: string) => uri,
}));

jest.mock('@/lib/iconName', () => ({
  getIoniconsName: () => 'card-outline',
}));

jest.mock('@/store/usePaymentMethodStore', () => ({
  usePaymentMethodStore: () => ({
    methods: [
      {
        id: 'method-1',
        type: 'custom',
        label: 'Test Method',
        iconName: 'card-outline',
        color: '#3B82F6',
        memo: 'Test memo',
      },
    ],
  }),
}));

describe('iOS billing screen', () => {
  test('renders a borderless list while preserving payment method navigation', async () => {
    const screen = await render(<BillingScreen />);
    const list = screen.getByTestId('ios-billing-list');
    const listStyle = StyleSheet.flatten(list.props.style);

    expect(listStyle).toEqual(expect.objectContaining({
      backgroundColor: '#1C1C1E',
      borderRadius: 16,
    }));
    expect(listStyle.borderWidth).toBeUndefined();

    await fireEvent.press(screen.getByRole('button', { name: 'Test Method' }));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/settings/payment-method-detail',
      params: { id: 'method-1' },
    });
  });
});
