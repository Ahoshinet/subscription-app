import { describe, expect, test } from '@jest/globals';

import type { Subscription } from '@/lib/api';
import { filterSubscriptionsByQuery } from '@/lib/subscriptionSearch';

const subscriptions: Subscription[] = [
  {
    id: 1,
    user_id: 'user',
    service_name: 'OpenAI ChatGPT',
    plan_name: 'Plus',
    amount: 20,
    currency: 'USD',
    next_payment_date: '2026-10-01',
    billing_cycle: 'monthly',
    payment_method: 'card',
    status: 'active',
  },
  {
    id: 2,
    user_id: 'user',
    service_name: 'YouTube',
    plan_name: 'Premium',
    amount: 1280,
    currency: 'JPY',
    next_payment_date: '2026-10-02',
    billing_cycle: 'monthly',
    payment_method: 'card',
    status: 'active',
  },
];

describe('filterSubscriptionsByQuery', () => {
  test('matches service and plan names without case sensitivity', () => {
    expect(filterSubscriptionsByQuery(subscriptions, 'chatgpt')).toEqual([subscriptions[0]]);
    expect(filterSubscriptionsByQuery(subscriptions, 'PREMIUM')).toEqual([subscriptions[1]]);
  });

  test('returns the source list for a blank query', () => {
    expect(filterSubscriptionsByQuery(subscriptions, '  ')).toBe(subscriptions);
  });
});
