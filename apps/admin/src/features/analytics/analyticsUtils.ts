import type {
  AnalyticsBucket,
  AnalyticsPeriod,
  AnalyticsSeries,
} from '@admin/api/analytics';

export const analyticsPeriods: Record<
  'day' | 'week' | 'month',
  AnalyticsPeriod
> = {
  day: 'DAILY',
  week: 'WEEKLY',
  month: 'MONTHLY',
};

/** 미확정·누락 값이 있으면 합계를 확정값으로 표시하지 않는다. 잔액 등 스냅샷에는 사용하지 않는다. */
export const sumAnalytics = <T extends AnalyticsBucket>(
  series: AnalyticsSeries<T> | undefined,
  field: keyof T,
): number | null => {
  if (
    !series?.items.length ||
    series.items.some(
      (item) => item.status !== 'FINAL' || typeof item[field] !== 'number',
    )
  )
    return null;
  return series.items.reduce((sum, item) => sum + (item[field] as number), 0);
};

export const getBucketEnd = (
  label: string,
  period: AnalyticsPeriod,
  to: string,
) => {
  if (period === 'DAILY') return label;
  const date = new Date(
    `${period === 'MONTHLY' ? label + '-01' : label}T00:00:00Z`,
  );
  if (period === 'MONTHLY') date.setUTCMonth(date.getUTCMonth() + 1, 0);
  else date.setUTCDate(date.getUTCDate() + 6);
  const end = date.toISOString().slice(0, 10);
  return end < to ? end : to;
};
