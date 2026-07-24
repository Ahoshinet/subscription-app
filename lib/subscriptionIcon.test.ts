import { describe, expect, test } from '@jest/globals';

import {
    buildSubscriptionPresetIconValue,
    isSubscriptionPresetIconValue,
    parseSubscriptionPresetIconValue,
} from './subscriptionIcon';

describe('subscriptionIcon', () => {
    test('round-trips preset icon values', () => {
        const value = buildSubscriptionPresetIconValue(
            {
                pack: 'fontawesome5',
                name: 'youtube',
                color: 'color(display-p3 1:0:0)',
            },
        );

        expect(parseSubscriptionPresetIconValue(value)).toEqual({
            pack: 'fontawesome5',
            name: 'youtube',
            color: 'color(display-p3 1:0:0)',
        });
        expect(isSubscriptionPresetIconValue(value)).toBe(true);
    });

    test.each([
        null,
        '',
        'https://example.com/icon.png',
        'icon:unknown:film:%23ffffff',
        'icon:ionicons:not-a-real-preset:%23ffffff',
        'icon:ionicons',
    ])('rejects a non-preset value: %s', (value) => {
        expect(parseSubscriptionPresetIconValue(value)).toBeNull();
        expect(isSubscriptionPresetIconValue(value)).toBe(false);
    });
});
