import {
  type AnalyticsQuery,
  getMemberMetrics,
  getSales,
  getStoreMetrics,
} from '@admin/api/analytics';
import { useAnalyticsQuery } from '@admin/features/analytics/useAnalyticsQuery';

export const useDashboardMetrics = (
  query: AnalyticsQuery | null,
  previousQuery: AnalyticsQuery | null,
  view: 'owners' | 'members',
) => {
  const memberQuery = view === 'members' ? query : null;
  const ownerQuery = view === 'owners' ? query : null;
  const members = useAnalyticsQuery(getMemberMetrics, memberQuery);
  const stores = useAnalyticsQuery(getStoreMetrics, ownerQuery);
  const sales = useAnalyticsQuery(getSales, ownerQuery);
  const previousMembers = useAnalyticsQuery(
    getMemberMetrics,
    view === 'members' ? previousQuery : null,
  );
  const previousStores = useAnalyticsQuery(
    getStoreMetrics,
    view === 'owners' ? previousQuery : null,
  );
  const previousSales = useAnalyticsQuery(
    getSales,
    view === 'owners' ? previousQuery : null,
  );
  return {
    members,
    stores,
    sales,
    previousMembers,
    previousStores,
    previousSales,
  };
};
