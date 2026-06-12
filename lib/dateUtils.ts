/**
 * Advances next_payment_date past today if the backend hasn't rolled it over yet
 * (e.g. offline, or between daily scheduler runs).
 *
 * Mirrors the server-side rollover: for monthly/yearly cycles, months are always
 * added to the *original* date so the day-of-month anchor survives short months
 * (Jan 31 → Feb 28 → Mar 31, not Mar 28). Naive `setMonth(+1)` would overflow
 * instead (Jan 31 → Mar 3) and silently skip the February payment.
 */
// All arithmetic uses UTC methods: next_payment_date is a UTC timestamp and
// the server's rollover (chrono on DateTime<Utc>) anchors on the UTC
// day-of-month. Local-time methods would shift the anchor by a day on
// devices west of UTC and diverge from the server.
function addMonthsClamped(base: Date, months: number): Date {
    const result = new Date(base);
    const anchorDay = base.getUTCDate();
    result.setUTCDate(1);
    result.setUTCMonth(result.getUTCMonth() + months);
    const daysInMonth = new Date(Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0)).getUTCDate();
    result.setUTCDate(Math.min(anchorDay, daysInMonth));
    return result;
}

export function getEffectiveNextPaymentDate(nextPaymentDate: string, billingCycle: string): string {
    const original = new Date(nextPaymentDate);
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    if (original >= today) return nextPaymentDate;

    if (billingCycle === 'weekly') {
        const date = new Date(original);
        while (date < today) {
            date.setUTCDate(date.getUTCDate() + 7);
        }
        date.setUTCHours(0, 0, 0, 0);
        return date.toISOString();
    }

    // 'monthly', 'yearly', and unknown cycles
    const step = billingCycle === 'yearly' ? 12 : 1;
    let months = step;
    let date = addMonthsClamped(original, months);
    while (date < today) {
        months += step;
        date = addMonthsClamped(original, months);
    }
    date.setUTCHours(0, 0, 0, 0);
    return date.toISOString();
}
