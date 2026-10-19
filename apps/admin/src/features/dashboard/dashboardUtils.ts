import type {
  BreakdownDimension,
  BreakdownMetric,
  DashboardDailyAggregate,
  DashboardRange,
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

// 퍼널 지표의 발생량은 서버 구간별 건수를 합산한다.
export const funnelMetrics: { value: FunnelMetric; label: string }[] = [
  { value: 'impressions', label: '유효 노출' },
  { value: 'saves', label: '찜' },
  { value: 'issued', label: '발급' },
  { value: 'used', label: '사용' },
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

export const getChangeLabel = (current: number, previous: number) => {
  if (previous === 0)
    return current === 0 ? '변동 없음' : '이전 기간 0 · 증감률 계산 불가';
  // 정정 내역으로 이전 소진액이 음수여도 증감 방향이 뒤집히지 않게 한다.
  const change = ((current - previous) / Math.abs(previous)) * 100;
  return `${change > 0 ? '+' : ''}${change.toFixed(1)}%`;
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
