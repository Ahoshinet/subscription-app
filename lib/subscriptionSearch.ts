import type { Subscription } from '@/lib/api';

export function filterSubscriptionsByQuery(
  subscriptions: Subscription[],
  query: string,
): Subscription[] {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  if (!normalizedQuery) return subscriptions;

  return subscriptions.filter((subscription) =>
    subscription.service_name.toLocaleLowerCase().includes(normalizedQuery)
    || subscription.plan_name?.toLocaleLowerCase().includes(normalizedQuery),
  );
}
