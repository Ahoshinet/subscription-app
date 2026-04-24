/**
 * Advances next_payment_date past today if the backend hasn't rolled it over yet.
 * The /api/subscriptions/renew endpoint is currently a stub, so this is done client-side.
 */
export function getEffectiveNextPaymentDate(nextPaymentDate: string, billingCycle: string): string {
    const date = new Date(nextPaymentDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (date >= today) return nextPaymentDate;

    while (date < today) {
        switch (billingCycle) {
            case 'yearly':
                date.setFullYear(date.getFullYear() + 1);
                break;
            case 'weekly':
                date.setDate(date.getDate() + 7);
                break;
            default: // 'monthly' and unknown
                date.setMonth(date.getMonth() + 1);
                break;
        }
    }

    date.setHours(0, 0, 0, 0);
    return date.toISOString();
}
