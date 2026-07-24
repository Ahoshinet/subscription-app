import { describe, expect, test } from '@jest/globals';

import {
    MAX_AMOUNT,
    isAmountInputAboveMax,
    parseAmountInput,
    toMonthlyAmount,
} from './currency';

describe('currency', () => {
    test('parses normalized non-negative amounts', () => {
        expect(parseAmountInput('１,２３４．５０')).toBe(1234.5);
        expect(parseAmountInput(' 1，000 ')).toBe(1000);
        expect(parseAmountInput('0')).toBe(0);
    });

    test('rejects empty, negative, non-numeric, and non-finite amounts', () => {
        expect(parseAmountInput('')).toBeNull();
        expect(parseAmountInput('-1')).toBeNull();
        expect(parseAmountInput('1.2.3')).toBeNull();
        expect(parseAmountInput('Infinity')).toBeNull();
    });

    test('detects values that cannot be represented safely', () => {
        expect(isAmountInputAboveMax(String(MAX_AMOUNT))).toBe(false);
        expect(isAmountInputAboveMax(`${MAX_AMOUNT}.1`)).toBe(true);
        expect(isAmountInputAboveMax('9007199254740992')).toBe(true);
        expect(isAmountInputAboveMax('-9007199254740992')).toBe(false);
    });

    test('normalizes recurring charges to monthly values', () => {
        expect(toMonthlyAmount(1200, 'yearly')).toBe(100);
        expect(toMonthlyAmount(100, 'weekly')).toBeCloseTo(433.333333);
        expect(toMonthlyAmount(100, 'monthly')).toBe(100);
        expect(toMonthlyAmount(100, 'unknown')).toBe(100);
    });
});
