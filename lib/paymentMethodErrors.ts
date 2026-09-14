import { ApiError } from '@/lib/api';

// The server rejects a payment method whose label matches an existing one
// with 409 Conflict. Map that to its own localized message so the user learns
// what to change instead of seeing a generic "try again" alert.
export function paymentMethodAddErrorKey(error: unknown): 'billing.add_duplicate' | 'billing.add_failed' {
    return error instanceof ApiError && error.status === 409
        ? 'billing.add_duplicate'
        : 'billing.add_failed';
}
