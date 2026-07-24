import { describe, expect, test } from '@jest/globals';

import {
    addDaysToDateOnly,
    daysBetweenDateOnly,
    formatDateOnly,
    formatDateOnlyForDisplay,
    getEffectiveNextPaymentDate,
    parseDateOnly,
} from './dateUtils';

describe('dateUtils', () => {
    test('parses canonical valid dates and rejects impossible dates', () => {
        expect(parseDateOnly('2024-02-29')).toEqual({ year: 2024, month: 2, day: 29 });
        expect(parseDateOnly('2023-02-29')).toBeNull();
        expect(parseDateOnly('2026-13-01')).toBeNull();
        expect(parseDateOnly('2026-1-01')).toBeNull();
    });

    test('formats local and display dates', () => {
        expect(formatDateOnly(new Date(2026, 0, 5, 12))).toBe('2026-01-05');
        expect(formatDateOnlyForDisplay('2026-01-05')).toBe('2026/01/05');
        expect(formatDateOnlyForDisplay('not-a-date')).toBe('not-a-date');
    });

    test('adds and compares date-only values across calendar boundaries', () => {
        expect(addDaysToDateOnly('2024-02-28', 2)).toBe('2024-03-01');
        expect(addDaysToDateOnly('2025-01-01', -1)).toBe('2024-12-31');
        expect(addDaysToDateOnly('invalid', 1)).toBe('invalid');
        expect(daysBetweenDateOnly('2025-12-31', '2026-01-02')).toBe(2);
        expect(daysBetweenDateOnly('2026-01-02', '2025-12-31')).toBe(-2);
        expect(daysBetweenDateOnly('invalid', '2026-01-02')).toBe(0);
    });

    test('keeps current and future payment dates unchanged', () => {
        expect(getEffectiveNextPaymentDate('2026-07-24', 'monthly', '2026-07-24', 24))
            .toBe('2026-07-24');
        expect(getEffectiveNextPaymentDate('2026-08-24', 'monthly', '2026-07-24', 24))
            .toBe('2026-08-24');
    });

    test('advances monthly payments using the billing anchor day', () => {
        expect(getEffectiveNextPaymentDate('2025-01-31', 'monthly', '2025-02-01', 31))
            .toBe('2025-02-28');
        expect(getEffectiveNextPaymentDate('2024-01-31', 'monthly', '2024-02-01', 31))
            .toBe('2024-02-29');
        expect(getEffectiveNextPaymentDate('2025-01-31', 'monthly', '2025-03-01', 31))
            .toBe('2025-03-31');
    });

    test('advances weekly and yearly payments to the first non-past date', () => {
        expect(getEffectiveNextPaymentDate('2026-07-01', 'weekly', '2026-07-10'))
            .toBe('2026-07-15');
        expect(getEffectiveNextPaymentDate('2024-02-29', 'yearly', '2025-03-01', 29))
            .toBe('2026-02-28');
    });
});
