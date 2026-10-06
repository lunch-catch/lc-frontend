import type {
  BreakdownDimension,
  DashboardDailyAggregate,
  DashboardInterval,
  DashboardRange,
  DashboardSummary,
  DashboardTrendPoint,
  UsageBreakdown,
  UsageMetric,
} from './dashboardTypes';

export const usageMetrics: { value: UsageMetric; label: string }[] = [
  { value: 'impressions', label: '유효 노출' },
  { value: 'saves', label: '찜' },
  { value: 'issued', label: '발급' },
  { value: 'used', label: '사용' },
];

export const shiftDate = (value: string, amount: number) => {
  const date = new Date(`${value}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
};

export const getPreviousRange = (range: DashboardRange): DashboardRange => {
  const length =
    Math.round(
      (Date.parse(range.endDate) - Date.parse(range.startDate)) / 86_400_000,
    ) + 1;
  return {
    startDate: shiftDate(range.startDate, -length),
    endDate: shiftDate(range.startDate, -1),
  };
};

export const selectDays = (
  days: DashboardDailyAggregate[],
  range: DashboardRange,
) =>
  days.filter(
    (day) => day.date >= range.startDate && day.date <= range.endDate,
  );

export const summarizeDays = (
  days: DashboardDailyAggregate[],
): DashboardSummary =>
  days.reduce(
    (sum, day) => ({
      impressions: sum.impressions + day.impressions,
      saves: sum.saves + day.saves,
      issued: sum.issued + day.issued,
      used: sum.used + day.used,
      totalImpressions: sum.totalImpressions + day.totalImpressions,
      newUsers: sum.newUsers + day.newUsers,
      newStores: sum.newStores + day.newStores,
      charge: sum.charge + day.charge,
      spend: sum.spend + day.spend,
      mismatchCount: sum.mismatchCount + day.mismatchCount,
    }),
    {
      impressions: 0,
      saves: 0,
      issued: 0,
      used: 0,
      totalImpressions: 0,
      newUsers: 0,
      newStores: 0,
      charge: 0,
      spend: 0,
      mismatchCount: 0,
    },
  );

export const getChangeLabel = (current: number, previous: number) => {
  if (previous === 0)
    return current === 0 ? '변동 없음' : '이전 기간 0 · 증감률 계산 불가';
  const change = ((current - previous) / previous) * 100;
  return `${change > 0 ? '+' : ''}${change.toFixed(1)}%`;
};

export const getBucketKey = (date: string, interval: DashboardInterval) => {
  if (interval === 'month') return date.slice(0, 7);
  if (interval === 'week') {
    const weekday = new Date(`${date}T00:00:00Z`).getUTCDay();
    return shiftDate(date, -((weekday + 6) % 7));
  }
  return date;
};

export const getTrend = (
  days: DashboardDailyAggregate[],
  range: DashboardRange,
  interval: DashboardInterval,
): DashboardTrendPoint[] => {
  const buckets = new Map<string, DashboardTrendPoint>();
  for (
    let date = range.startDate;
    date <= range.endDate;
    date = shiftDate(date, 1)
  ) {
    const key = getBucketKey(date, interval);
    if (!buckets.has(key))
      buckets.set(key, {
        label: key,
        impressions: 0,
        saves: 0,
        issued: 0,
        used: 0,
        charge: 0,
        spend: 0,
      });
  }
  for (const day of selectDays(days, range)) {
    const bucket = buckets.get(getBucketKey(day.date, interval))!;
    for (const metric of usageMetrics)
      bucket[metric.value] += day[metric.value];
    bucket.charge += day.charge;
    bucket.spend += day.spend;
  }
  return [...buckets.values()];
};

export const getBreakdown = (
  days: DashboardDailyAggregate[],
  dimension: BreakdownDimension,
) => {
  const rows = new Map<string, UsageBreakdown>();
  for (const day of days) {
    for (const item of dimension === 'region' ? day.regions : day.categories) {
      const row = rows.get(item.name) ?? {
        name: item.name,
        impressions: 0,
        saves: 0,
        issued: 0,
        used: 0,
      };
      for (const metric of usageMetrics)
        row[metric.value] += item[metric.value];
      rows.set(item.name, row);
    }
  }
  return [...rows.values()];
};
