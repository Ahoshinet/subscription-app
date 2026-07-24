import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';

import {
    formatTimeZoneOffset,
    getTodayDateInTimeZone,
    isTimeZoneSupported,
    zonedDateTimeToDate,
} from './timeZone';

describe('timeZone', () => {
    beforeEach(() => {
        jest.useFakeTimers();
        jest.setSystemTime(new Date('2026-01-01T00:30:00.000Z'));
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    test('validates IANA time zone names', () => {
        expect(isTimeZoneSupported('UTC')).toBe(true);
        expect(isTimeZoneSupported('Asia/Tokyo')).toBe(true);
        expect(isTimeZoneSupported('Not/A_Time_Zone')).toBe(false);
    });

    test('gets the local calendar date for an instant', () => {
        expect(getTodayDateInTimeZone('Asia/Tokyo')).toBe('2026-01-01');
        expect(getTodayDateInTimeZone('America/Los_Angeles')).toBe('2025-12-31');
    });

    test('formats offsets at the current instant', () => {
        expect(formatTimeZoneOffset('UTC')).toBe('UTC');
        expect(formatTimeZoneOffset('Asia/Tokyo')).toBe('UTC+09:00');
        expect(formatTimeZoneOffset('Not/A_Time_Zone')).toBe('Not/A_Time_Zone (unsupported)');
    });

    test('converts local wall-clock time to the correct UTC instant', () => {
        expect(zonedDateTimeToDate('2026-01-15', 'Asia/Tokyo', 9)?.toISOString())
            .toBe('2026-01-15T00:00:00.000Z');
        expect(zonedDateTimeToDate('2026-01-15', 'America/New_York', 9)?.toISOString())
            .toBe('2026-01-15T14:00:00.000Z');
        expect(zonedDateTimeToDate('2026-07-15', 'America/New_York', 9)?.toISOString())
            .toBe('2026-07-15T13:00:00.000Z');
    });

    test('rejects invalid dates and unsupported zones', () => {
        expect(zonedDateTimeToDate('2026-02-30', 'UTC')).toBeNull();
        expect(zonedDateTimeToDate('2026-01-01', 'Not/A_Time_Zone')).toBeNull();
    });
});
