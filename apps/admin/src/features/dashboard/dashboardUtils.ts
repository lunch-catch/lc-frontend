import {
  getBucketKey,
  shiftDate,
} from '@admin/features/analytics/analyticsDateUtils';

import type {
  BreakdownDimension,
  BreakdownMetric,
  DashboardDailyAggregate,
  DashboardInterval,
  DashboardRange,
  DashboardSummary,
  DashboardTrendPoint,
  FunnelMetric,
  UsageBreakdown,
  UsageMetric,
} from './dashboardTypes';
export {
  getAnalyticsRangeError,
  getPreviousRange,
  shiftDate,
} from '@admin/features/analytics/analyticsDateUtils';

export const usageMetrics: { value: UsageMetric; label: string }[] = [
  { value: 'impressions', label: '노출' },
  { value: 'saves', label: '찜' },
  { value: 'issued', label: '발급' },
  { value: 'used', label: '사용' },
];

// 플랫폼 퍼널 응답에는 사용 건수가 없으며, 사용 건수는 지역·카테고리 분석에서만 제공한다.
export const funnelMetrics: { value: FunnelMetric; label: string }[] = [
  { value: 'impressions', label: '유효 노출' },
  { value: 'saves', label: '찜' },
  { value: 'issued', label: '발급' },
];
export const breakdownMetrics: { value: BreakdownMetric; label: string }[] = [
  ...usageMetrics,
  { value: 'spend', label: '소진액' },
];

export const selectDays = (
  days: DashboardDailyAggregate[],
  range: DashboardRange,
) =>
  days.filter(
    (day) => day.date >= range.startDate && day.date <= range.endDate,
  );

/** API가 없는 이용현황 예시만 합산한다. */
export const summarizeDays = (
  days: DashboardDailyAggregate[],
): DashboardSummary =>
  days.reduce(
    (sum, day) => ({
      impressions: sum.impressions + day.impressions,
      saves: sum.saves + day.saves,
      issued: sum.issued + day.issued,
      totalImpressions: sum.totalImpressions + day.totalImpressions,
    }),
    { impressions: 0, saves: 0, issued: 0, totalImpressions: 0 },
  );

export const getChangeLabel = (current: number, previous: number) => {
  if (previous === 0)
    return current === 0 ? '변동 없음' : '이전 기간 0 · 증감률 계산 불가';
  // 정정 내역으로 이전 소진액이 음수여도 증감 방향이 뒤집히지 않게 한다.
  const change = ((current - previous) / Math.abs(previous)) * 100;
  return `${change > 0 ? '+' : ''}${change.toFixed(1)}%`;
};

/** 월요일·월초로 구간을 묶되 선택한 날짜에 포함된 발생량만 합산한다. */
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
      });
  }
  for (const day of selectDays(days, range)) {
    const bucket = buckets.get(getBucketKey(day.date, interval))!;
    for (const metric of funnelMetrics)
      bucket[metric.value] += day[metric.value];
  }
  return [...buckets.values()];
};

export const getBreakdown = (
  days: DashboardDailyAggregate[],
  dimension: BreakdownDimension,
  filters: { region?: string; category?: string } = {},
) => {
  const rows = new Map<string, UsageBreakdown>();
  for (const day of days) {
    for (const item of day.segments) {
      if (
        (filters.region && item.region !== filters.region) ||
        (filters.category && item.category !== filters.category)
      )
        continue;
      const name = item[dimension];
      const row = rows.get(name) ?? {
        name,
        impressions: 0,
        saves: 0,
        issued: 0,
        used: 0,
        spend: 0,
      };
      for (const metric of breakdownMetrics)
        row[metric.value] += item[metric.value];
      rows.set(name, row);
    }
  }
  return [...rows.values()];
};
