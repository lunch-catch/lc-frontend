import { ApiError, requestData } from './client';

export type AnalyticsPeriod = 'DAILY' | 'WEEKLY' | 'MONTHLY';
export interface AnalyticsQuery {
  period: AnalyticsPeriod;
  from: string;
  to: string;
}
export interface AnalyticsBucket {
  label: string;
  status: 'FINAL' | 'IN_PROGRESS';
}
export interface AnalyticsSeries<
  T extends AnalyticsBucket,
> extends AnalyticsQuery {
  aggregatedAt: string | null;
  items: T[];
}
export interface MemberMetrics extends AnalyticsBucket {
  newMemberCount: number | null;
  cumulativeMemberCount: number | null;
  avgDailyActiveMembers: number | null;
  withdrawnCount: number | null;
  suspendedCount: number | null;
}
export interface StoreMetrics extends AnalyticsBucket {
  newStoreCount: number | null;
  cumulativeStoreCount: number | null;
  activeCampaignCount: number | null;
}
export interface SalesMetrics extends AnalyticsBucket {
  chargeAmount: number | null;
  spentAmount: number | null;
  refundAmount: number | null;
  adjustAmount: number | null;
  unspentBalance: number | null;
}

const readSeries = async <T extends AnalyticsBucket>(
  path: string,
  query: AnalyticsQuery,
  fields: readonly string[],
  signal: AbortSignal,
): Promise<AnalyticsSeries<T>> => {
  const params = new URLSearchParams({ ...query });
  const data = await requestData<AnalyticsSeries<T>>(
    `${path}?${params}`,
    { signal },
    200,
  );
  const labelPattern =
    query.period === 'MONTHLY' ? /^\d{4}-\d{2}$/ : /^\d{4}-\d{2}-\d{2}$/;
  if (
    data.period !== query.period ||
    data.from !== query.from ||
    data.to !== query.to ||
    (data.aggregatedAt !== null &&
      (typeof data.aggregatedAt !== 'string' ||
        !Number.isFinite(Date.parse(data.aggregatedAt)))) ||
    !Array.isArray(data.items) ||
    data.items.some((item, index) => {
      if (
        !item ||
        typeof item !== 'object' ||
        !labelPattern.test(item.label) ||
        !['FINAL', 'IN_PROGRESS'].includes(item.status) ||
        (index > 0 && data.items[index - 1].label >= item.label)
      )
        return true;
      const values = item as unknown as Record<string, unknown>;
      // FINAL에서도 누적 스냅샷이 없으면 null일 수 있다. 집계 중인 값은 0으로 대체하지 않는다.
      return fields.some((field) =>
        item.status === 'IN_PROGRESS'
          ? values[field] !== null
          : values[field] !== null && !Number.isSafeInteger(values[field]),
      );
    })
  )
    throw new ApiError('집계 응답 형식을 확인할 수 없습니다.', 200);
  return data;
};

export const getMemberMetrics = (query: AnalyticsQuery, signal: AbortSignal) =>
  readSeries<MemberMetrics>(
    '/v1/admin/dashboard/members',
    query,
    [
      'newMemberCount',
      'cumulativeMemberCount',
      'avgDailyActiveMembers',
      'withdrawnCount',
      'suspendedCount',
    ],
    signal,
  );
export const getStoreMetrics = (query: AnalyticsQuery, signal: AbortSignal) =>
  readSeries<StoreMetrics>(
    '/v1/admin/dashboard/stores',
    query,
    ['newStoreCount', 'cumulativeStoreCount', 'activeCampaignCount'],
    signal,
  );
export const getSales = (query: AnalyticsQuery, signal: AbortSignal) =>
  readSeries<SalesMetrics>(
    '/v1/admin/sales',
    query,
    [
      'chargeAmount',
      'spentAmount',
      'refundAmount',
      'adjustAmount',
      'unspentBalance',
    ],
    signal,
  );
