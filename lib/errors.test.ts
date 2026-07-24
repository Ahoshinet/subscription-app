import { describe, expect, test } from '@jest/globals';

import { getErrorMessage } from './errors';

describe('getErrorMessage', () => {
    test('returns a non-empty Error message', () => {
        expect(getErrorMessage(new Error('Storage unavailable'), 'Fallback'))
            .toBe('Storage unavailable');
    });

    test('supports structurally compatible errors', () => {
        expect(getErrorMessage({ message: 'Request failed' }, 'Fallback'))
            .toBe('Request failed');
    });

    test.each([
        null,
        undefined,
        'Thrown string',
        42,
        {},
        { message: '' },
        { message: 123 },
    ])('uses the fallback for an unknown value: %p', (error) => {
        expect(getErrorMessage(error, 'Fallback')).toBe('Fallback');
    });
});
