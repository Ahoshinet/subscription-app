import { describe, expect, test } from '@jest/globals';

import { getIoniconsName, isIoniconsName } from './iconName';

describe('Ionicons names', () => {
    test('accepts a glyph included by Ionicons', () => {
        expect(isIoniconsName('logo-paypal')).toBe(true);
        expect(getIoniconsName('logo-paypal')).toBe('logo-paypal');
    });

    test('falls back for missing or unsupported glyphs', () => {
        expect(isIoniconsName('future-icon')).toBe(false);
        expect(getIoniconsName('future-icon')).toBe('card-outline');
        expect(getIoniconsName(null, 'help-circle-outline'))
            .toBe('help-circle-outline');
    });
});
