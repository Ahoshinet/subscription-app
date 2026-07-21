const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

export interface DateOnlyParts {
    year: number;
    month: number;
    day: number;
}

export function parseDateOnly(value: string): DateOnlyParts | null {
    const match = DATE_ONLY_PATTERN.exec(value);
    if (!match) return null;

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const check = new Date(Date.UTC(year, month - 1, day));
    if (
        check.getUTCFullYear() !== year
        || check.getUTCMonth() !== month - 1
        || check.getUTCDate() !== day
    ) {
        return null;
    }
    return { year, month, day };
}

export function formatDateOnly(date: Date): string {
    return [
        String(date.getFullYear()).padStart(4, '0'),
        String(date.getMonth() + 1).padStart(2, '0'),
        String(date.getDate()).padStart(2, '0'),
    ].join('-');
}

export function dateOnlyToLocalDate(value: string): Date {
    const parts = parseDateOnly(value);
    if (!parts) return new Date();
    // Noon avoids the rare zones whose offset transition occurs at midnight.
    return new Date(parts.year, parts.month - 1, parts.day, 12, 0, 0, 0);
}

export function formatDateOnlyForDisplay(value: string): string {
    const parts = parseDateOnly(value);
    if (!parts) return value;
    return `${parts.year}/${String(parts.month).padStart(2, '0')}/${String(parts.day).padStart(2, '0')}`;
}

function toUtcDate(value: string): Date | null {
    const parts = parseDateOnly(value);
    return parts ? new Date(Date.UTC(parts.year, parts.month - 1, parts.day)) : null;
}

function fromUtcDate(date: Date): string {
    return [
        String(date.getUTCFullYear()).padStart(4, '0'),
        String(date.getUTCMonth() + 1).padStart(2, '0'),
        String(date.getUTCDate()).padStart(2, '0'),
    ].join('-');
}

export function addDaysToDateOnly(value: string, days: number): string {
    const date = toUtcDate(value);
    if (!date) return value;
    date.setUTCDate(date.getUTCDate() + days);
    return fromUtcDate(date);
}

export function daysBetweenDateOnly(from: string, to: string): number {
    const fromDate = toUtcDate(from);
    const toDate = toUtcDate(to);
    if (!fromDate || !toDate) return 0;
    return Math.round((toDate.getTime() - fromDate.getTime()) / 86_400_000);
}

function addMonthsClamped(base: Date, months: number): Date {
    const result = new Date(base);
    const anchorDay = base.getUTCDate();
    result.setUTCDate(1);
    result.setUTCMonth(result.getUTCMonth() + months);
    const daysInMonth = new Date(
        Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0),
    ).getUTCDate();
    result.setUTCDate(Math.min(anchorDay, daysInMonth));
    return result;
}

/**
 * Advances a date-only payment date past the account's current local date
 * when the server has not rolled it over yet (for example while offline).
 */
export function getEffectiveNextPaymentDate(
    nextPaymentDate: string,
    billingCycle: string,
    todayDate: string,
): string {
    const original = toUtcDate(nextPaymentDate);
    const today = toUtcDate(todayDate);
    if (!original || !today || original >= today) return nextPaymentDate;

    if (billingCycle === 'weekly') {
        const date = new Date(original);
        while (date < today) date.setUTCDate(date.getUTCDate() + 7);
        return fromUtcDate(date);
    }

    const step = billingCycle === 'yearly' ? 12 : 1;
    let months = step;
    let date = addMonthsClamped(original, months);
    while (date < today) {
        months += step;
        date = addMonthsClamped(original, months);
    }
    return fromUtcDate(date);
}
