import {
  type AnalyticsQuery,
  getMemberMetrics,
  getSales,
  getStoreMetrics,
} from '@admin/api/analytics';
import { getSettlementMismatches } from '@admin/api/settlementMismatches';
import { useAnalyticsQuery } from '@admin/features/analytics/useAnalyticsQuery';

const getMismatchCount = (query: AnalyticsQuery, signal: AbortSignal) =>
  getSettlementMismatches(
    new URLSearchParams({
      from: query.from,
      to: query.to,
      page: '0',
      size: '1',
    }).toString(),
    signal,
  ).then((page) => page.totalElements);

export const useDashboardMetrics = (
  query: AnalyticsQuery | null,
  previousQuery: AnalyticsQuery | null,
  mismatchQuery: AnalyticsQuery | null,
) => {
  const members = useAnalyticsQuery(getMemberMetrics, query);
  const stores = useAnalyticsQuery(getStoreMetrics, query);
  const sales = useAnalyticsQuery(getSales, query);
  const previousMembers = useAnalyticsQuery(getMemberMetrics, previousQuery);
  const previousStores = useAnalyticsQuery(getStoreMetrics, previousQuery);
  const previousSales = useAnalyticsQuery(getSales, previousQuery);
  const mismatches = useAnalyticsQuery(getMismatchCount, mismatchQuery);
  return {
    members,
    stores,
    sales,
    previousMembers,
    previousStores,
    previousSales,
    mismatches,
  };
};
