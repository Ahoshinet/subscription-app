import { DateOnlyParts, parseDateOnly } from './dateUtils';

export const DEFAULT_TIME_ZONE = 'Asia/Tokyo';

const FALLBACK_TIME_ZONES = [
    'UTC',
    'Asia/Tokyo',
    'Asia/Seoul',
    'Asia/Shanghai',
    'Asia/Hong_Kong',
    'Asia/Singapore',
    'Asia/Kolkata',
    'Asia/Dubai',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'America/Sao_Paulo',
    'Australia/Sydney',
    'Pacific/Auckland',
];

export function getDeviceTimeZone(): string {
    try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone || DEFAULT_TIME_ZONE;
    } catch {
        return DEFAULT_TIME_ZONE;
    }
}

export function getSupportedTimeZones(): string[] {
    const intlWithSupportedValues = Intl as typeof Intl & {
        supportedValuesOf?: (key: 'timeZone') => string[];
    };
    const referenceInstant = new Date();
    let zones: string[] = [];
    try {
        zones = intlWithSupportedValues.supportedValuesOf?.('timeZone') ?? [];
    } catch {
        // Older Hermes versions do not expose supportedValuesOf.
    }
    const supportedZones = Array.from(
        new Set([getDeviceTimeZone(), ...zones, ...FALLBACK_TIME_ZONES]),
    ).filter(isTimeZoneSupported);
    const offsetByZone = new Map(
        supportedZones.map((zone) => [zone, getTimeZoneOffsetMinutes(zone, referenceInstant)]),
    );

    return supportedZones.sort((left, right) => {
        const leftOffset = offsetByZone.get(left);
        const rightOffset = offsetByZone.get(right);

        if (leftOffset !== rightOffset) {
            return (leftOffset ?? Number.POSITIVE_INFINITY)
                - (rightOffset ?? Number.POSITIVE_INFINITY);
        }
        return left.localeCompare(right);
    });
}

export function isTimeZoneSupported(timeZone: string): boolean {
    try {
        new Intl.DateTimeFormat('en-US', { timeZone }).format(new Date());
        return true;
    } catch {
        return false;
    }
}

function formatToPartsInTimeZone(
    instant: Date,
    timeZone: string,
    options: Intl.DateTimeFormatOptions,
): Intl.DateTimeFormatPart[] | null {
    try {
        return new Intl.DateTimeFormat('en-US', {
            ...options,
            timeZone,
        }).formatToParts(instant);
    } catch {
        // Never silently substitute a different zone: callers can surface the
        // unsupported account setting and ask the user to choose another one.
        return null;
    }
}

export function getTodayDateInTimeZone(timeZone: string): string {
    const now = new Date();
    const parts = formatToPartsInTimeZone(now, timeZone, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    });
    if (!parts) {
        console.warn(`[timeZone] Unsupported time zone: ${timeZone}`);
        return now.toISOString().slice(0, 10);
    }
    const value = (type: Intl.DateTimeFormatPartTypes) =>
        parts.find((part) => part.type === type)?.value ?? '';
    return `${value('year')}-${value('month')}-${value('day')}`;
}

function getTimeZoneOffsetMinutes(timeZone: string, instant: Date): number | null {
    const parts = formatToPartsInTimeZone(instant, timeZone, {
        hourCycle: 'h23',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });
    if (!parts) return null;

    const value = (type: Intl.DateTimeFormatPartTypes) =>
        Number(parts.find((part) => part.type === type)?.value ?? Number.NaN);
    const zonedAsUtc = Date.UTC(
        value('year'),
        value('month') - 1,
        value('day'),
        value('hour'),
        value('minute'),
        value('second'),
    );
    if (!Number.isFinite(zonedAsUtc)) return null;
    const instantToSecond = Math.floor(instant.getTime() / 1000) * 1000;
    return Math.round((zonedAsUtc - instantToSecond) / 60_000);
}

export function formatTimeZoneOffset(timeZone: string): string {
    const offsetMinutes = getTimeZoneOffsetMinutes(timeZone, new Date());
    if (offsetMinutes === null) return `${timeZone} (unsupported)`;
    if (offsetMinutes === 0) return 'UTC';
    const sign = offsetMinutes >= 0 ? '+' : '-';
    const absolute = Math.abs(offsetMinutes);
    return `UTC${sign}${String(Math.floor(absolute / 60)).padStart(2, '0')}:${String(absolute % 60).padStart(2, '0')}`;
}

function partsAsUtc(parts: DateOnlyParts, hour: number, minute: number): number {
    return Date.UTC(parts.year, parts.month - 1, parts.day, hour, minute, 0, 0);
}

function dateTimePartsAt(instant: Date, timeZone: string): (DateOnlyParts & { hour: number; minute: number }) | null {
    const formatted = formatToPartsInTimeZone(instant, timeZone, {
        hourCycle: 'h23',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    });
    if (!formatted) return null;
    const value = (type: Intl.DateTimeFormatPartTypes) =>
        Number(formatted.find((part) => part.type === type)?.value ?? 0);
    return {
        year: value('year'),
        month: value('month'),
        day: value('day'),
        hour: value('hour'),
        minute: value('minute'),
    };
}

/** Converts an unambiguous local wall-clock time to its UTC instant. */
export function zonedDateTimeToDate(
    dateOnly: string,
    timeZone: string,
    hour = 9,
    minute = 0,
): Date | null {
    const desired = parseDateOnly(dateOnly);
    if (!desired) return null;

    const localAsUtc = partsAsUtc(desired, hour, minute);
    let candidate = new Date(localAsUtc);
    // Two passes handle an offset change between the initial UTC guess and
    // the target instant. Reminder time is 09:00, so it is never ambiguous.
    for (let i = 0; i < 2; i++) {
        const observed = dateTimePartsAt(candidate, timeZone);
        if (!observed) return null;
        const observedAsUtc = partsAsUtc(observed, observed.hour, observed.minute);
        candidate = new Date(candidate.getTime() + (localAsUtc - observedAsUtc));
    }
    return candidate;
}
