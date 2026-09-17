import { describe, expect, test } from '@jest/globals';

import { ApiError } from './api';
import { paymentMethodAddErrorKey } from './paymentMethodErrors';

describe('paymentMethodAddErrorKey', () => {
    test('maps a 409 conflict to the duplicate-label message', () => {
        expect(paymentMethodAddErrorKey(new ApiError('dup', 409))).toBe('billing.add_duplicate');
    });

    test('falls back to the generic message for other API errors', () => {
        expect(paymentMethodAddErrorKey(new ApiError('boom', 500))).toBe('billing.add_failed');
    });

    test('falls back to the generic message for non-API errors', () => {
        expect(paymentMethodAddErrorKey(new Error('offline'))).toBe('billing.add_failed');
        expect(paymentMethodAddErrorKey(undefined)).toBe('billing.add_failed');
    });
});
