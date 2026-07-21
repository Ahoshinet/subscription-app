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
    let zones: string[] = [];
    try {
        zones = intlWithSupportedValues.supportedValuesOf?.('timeZone') ?? [];
    } catch {
        // Older Hermes versions do not expose supportedValuesOf.
    }
    return Array.from(new Set([getDeviceTimeZone(), ...zones, ...FALLBACK_TIME_ZONES])).sort();
}

function formatToPartsInTimeZone(
    instant: Date,
    timeZone: string,
    options: Intl.DateTimeFormatOptions,
): Intl.DateTimeFormatPart[] | null {
    const fallbackTimeZones = [timeZone, getDeviceTimeZone(), DEFAULT_TIME_ZONE, 'UTC'];
    for (const candidate of new Set(fallbackTimeZones)) {
        try {
            return new Intl.DateTimeFormat('en-US', {
                ...options,
                timeZone: candidate,
            }).formatToParts(instant);
        } catch {
            // Try the next supported zone when account data is invalid or the
            // platform's Intl implementation lacks the requested IANA zone.
        }
    }
    return null;
}

export function getTodayDateInTimeZone(timeZone: string): string {
    const now = new Date();
    const parts = formatToPartsInTimeZone(now, timeZone, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    });
    if (!parts) {
        return [
            String(now.getFullYear()).padStart(4, '0'),
            String(now.getMonth() + 1).padStart(2, '0'),
            String(now.getDate()).padStart(2, '0'),
        ].join('-');
    }
    const value = (type: Intl.DateTimeFormatPartTypes) =>
        parts.find((part) => part.type === type)?.value ?? '';
    return `${value('year')}-${value('month')}-${value('day')}`;
}

export function formatTimeZoneOffset(timeZone: string): string {
    try {
        const part = new Intl.DateTimeFormat('en-US', {
            timeZone,
            timeZoneName: 'longOffset',
        }).formatToParts(new Date()).find((item) => item.type === 'timeZoneName');
        return part?.value?.replace('GMT', 'UTC') ?? timeZone;
    } catch {
        return timeZone;
    }
}

function partsAsUtc(parts: DateOnlyParts, hour: number, minute: number): number {
    return Date.UTC(parts.year, parts.month - 1, parts.day, hour, minute, 0, 0);
}

function dateTimePartsAt(instant: Date, timeZone: string): DateOnlyParts & { hour: number; minute: number } {
    const formatted = formatToPartsInTimeZone(instant, timeZone, {
        hourCycle: 'h23',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    });
    if (!formatted) {
        return {
            year: instant.getUTCFullYear(),
            month: instant.getUTCMonth() + 1,
            day: instant.getUTCDate(),
            hour: instant.getUTCHours(),
            minute: instant.getUTCMinutes(),
        };
    }
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
        const observedAsUtc = partsAsUtc(observed, observed.hour, observed.minute);
        candidate = new Date(candidate.getTime() + (localAsUtc - observedAsUtc));
    }
    return candidate;
}
