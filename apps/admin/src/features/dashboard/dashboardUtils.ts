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

export const dashboardRangeLimits = { day: 92, week: 53, month: 13 };

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

/** 선택 기간이 걸치는 일·주·월 구간 수를 기준으로 조회 한도를 검증한다. */
export const getDashboardRangeError = (
  range: DashboardRange,
  interval: DashboardInterval,
) => {
  const start = Date.parse(range.startDate);
  const end = Date.parse(range.endDate);
  if (!Number.isFinite(start) || !Number.isFinite(end) || start > end)
    return '시작일과 종료일을 올바르게 선택해 주세요.';
  const startBucket = getBucketKey(range.startDate, interval);
  const endBucket = getBucketKey(range.endDate, interval);
  if (interval === 'month') {
    const monthIndex = (date: string) =>
      Number(date.slice(0, 4)) * 12 + Number(date.slice(5, 7));
    return monthIndex(endBucket) - monthIndex(startBucket) >=
      dashboardRangeLimits.month
      ? `월별 조회는 최대 ${dashboardRangeLimits.month}개월까지 가능합니다.`
      : '';
  }
  const count = (Date.parse(endBucket) - Date.parse(startBucket)) / 86_400_000;
  if (interval === 'week')
    return count / 7 >= dashboardRangeLimits.week
      ? `주별 조회는 최대 ${dashboardRangeLimits.week}주까지 가능합니다.`
      : '';
  return count >= dashboardRangeLimits.day
    ? `일별 조회는 최대 ${dashboardRangeLimits.day}일까지 가능합니다.`
    : '';
};

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

/** 발생량은 합산하고, 활성 사용자 수는 주간·월간 순사용자 수 대신 일평균으로 집계한다. */
export const summarizeDays = (
  days: DashboardDailyAggregate[],
): DashboardSummary => {
  const total = days.reduce(
    (sum, day) => ({
      impressions: sum.impressions + day.impressions,
      saves: sum.saves + day.saves,
      issued: sum.issued + day.issued,
      totalImpressions: sum.totalImpressions + day.totalImpressions,
      newUsers: sum.newUsers + day.newUsers,
      newStores: sum.newStores + day.newStores,
      activeUsers: sum.activeUsers + day.activeUsers,
      charge: sum.charge + day.charge,
      spend: sum.spend + day.spend,
      refund: sum.refund + day.refund,
      adjustment: sum.adjustment + day.adjustment,
      mismatchCount: sum.mismatchCount + day.mismatchCount,
    }),
    {
      impressions: 0,
      saves: 0,
      issued: 0,
      totalImpressions: 0,
      newUsers: 0,
      newStores: 0,
      activeUsers: 0,
      charge: 0,
      spend: 0,
      refund: 0,
      adjustment: 0,
      mismatchCount: 0,
    },
  );
  return {
    ...total,
    activeUsers: Math.round(total.activeUsers / Math.max(1, days.length)),
  };
};

export const getChangeLabel = (current: number, previous: number) => {
  if (previous === 0)
    return current === 0 ? '변동 없음' : '이전 기간 0 · 증감률 계산 불가';
  // 정정 내역으로 이전 소진액이 음수여도 증감 방향이 뒤집히지 않게 한다.
  const change = ((current - previous) / Math.abs(previous)) * 100;
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
        charge: 0,
        spend: 0,
      });
  }
  for (const day of selectDays(days, range)) {
    const bucket = buckets.get(getBucketKey(day.date, interval))!;
    for (const metric of funnelMetrics)
      bucket[metric.value] += day[metric.value];
    bucket.charge += day.charge;
    bucket.spend += day.spend;
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
