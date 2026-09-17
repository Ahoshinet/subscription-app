import { describe, expect, jest, test } from '@jest/globals';
import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import BillingScreen from './billing-screen.ios';

const mockPush = jest.fn();
const mockSymbolView = jest.fn();
let lastScreenOptions: Record<string, unknown> | undefined;

jest.mock('expo-router', () => ({
  Stack: {
    Screen: ({ options }: { options: Record<string, unknown> }) => {
      lastScreenOptions = options;
      return null;
    },
  },
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('expo-symbols', () => ({
  SymbolView: (props: Record<string, unknown>) => {
    mockSymbolView(props);
    return null;
  },
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
      {
        id: 'method-2',
        type: 'custom',
        label: 'Second Method',
        iconName: 'card-outline',
        color: '#3B82F6',
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

  test('uses a native header item for adding and SF Symbol chevrons', async () => {
    const screen = await render(<BillingScreen />);

    expect(lastScreenOptions?.headerShadowVisible).toBe(false);
    expect(lastScreenOptions?.headerRight).toBeUndefined();
    const items = (lastScreenOptions?.unstable_headerRightItems as () => Record<string, unknown>[])();
    expect(items).toEqual([
      expect.objectContaining({
        type: 'button',
        icon: { type: 'sfSymbol', name: 'plus' },
        accessibilityLabel: 'billing.add_method_title',
      }),
    ]);
    (items[0].onPress as () => void)();
    expect(mockPush).toHaveBeenCalledWith('/add-payment-method');

    expect(mockSymbolView).toHaveBeenCalledWith(expect.objectContaining({
      name: 'chevron.right',
      weight: 'semibold',
      tintColor: 'rgba(235, 235, 245, 0.30)',
    }));
    const chevronProps = mockSymbolView.mock.calls[0][0] as { style: unknown };
    expect(StyleSheet.flatten(chevronProps.style as StyleProp<ViewStyle>)).toEqual({
      height: 18,
      width: 10,
    });
    await screen.unmount();
  });

  test('starts separators at the text label and omits the last one', async () => {
    const screen = await render(<BillingScreen />);

    const separator = screen.getByTestId('ios-billing-separator-method-1');
    expect(StyleSheet.flatten(separator.props.style)).toEqual(expect.objectContaining({
      height: StyleSheet.hairlineWidth,
      left: 68,
      right: 16,
    }));
    expect(screen.queryByTestId('ios-billing-separator-method-2')).toBeNull();
    await screen.unmount();
  });
});
