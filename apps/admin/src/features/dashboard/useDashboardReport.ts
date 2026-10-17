import { queryChoice, queryDate } from '@admin/hooks/urlQuery';
import { useUrlFilters } from '@admin/hooks/useUrlFilters';

import type {
  DashboardDataset,
  DashboardInterval,
  DashboardRange,
  FunnelMetric,
} from './dashboardTypes';
import {
  getDashboardRangeError,
  getPreviousRange,
  getTrend,
  selectDays,
  shiftDate,
  summarizeDays,
} from './dashboardUtils';

export const useDashboardReport = (data: DashboardDataset) => {
  const { filters, updateFilters } = useUrlFilters('dashboard.', {
    from: queryDate(shiftDate(data.completedThrough, -13)),
    to: queryDate(data.completedThrough),
    interval: queryChoice(['day', 'week', 'month'] as const, 'day'),
    metric: queryChoice(
      ['impressions', 'saves', 'issued'] as const,
      'impressions',
    ),
    compare: queryChoice(['true', 'false'] as const, 'true'),
  });
  const range = { startDate: filters.from, endDate: filters.to };
  const { interval, metric } = filters;
  const compare = filters.compare === 'true';
  const setRange = (value: DashboardRange) =>
    updateFilters({ from: value.startDate, to: value.endDate });
  const setInterval = (interval: DashboardInterval) =>
    updateFilters({ interval });
  const setMetric = (metric: FunnelMetric) => updateFilters({ metric });
  const setCompare = (compare: boolean) =>
    updateFilters({ compare: compare ? 'true' : 'false' });
  const rangeError =
    getDashboardRangeError(range, interval) ||
    (range.startDate < data.availableFrom
      ? `조회 가능한 기간은 ${data.availableFrom}부터입니다.`
      : '');
  const validRange = !rangeError;
  const completedRange = {
    ...range,
    endDate:
      range.endDate < data.completedThrough
        ? range.endDate
        : data.completedThrough,
  };
  const hasCompletedPeriod =
    validRange && completedRange.startDate <= completedRange.endDate;
  const days = hasCompletedPeriod ? selectDays(data.days, completedRange) : [];
  const previousRange = hasCompletedPeriod
    ? getPreviousRange(completedRange)
    : undefined;
  const canCompare = Boolean(
    previousRange &&
    previousRange.startDate >= data.availableFrom &&
    !getDashboardRangeError(previousRange, interval),
  );
  const previousDays =
    previousRange && canCompare ? selectDays(data.days, previousRange) : [];
  const summary = summarizeDays(days);
  const previous = summarizeDays(previousDays);
  const snapshot = days.at(-1);
  const trend = hasCompletedPeriod
    ? getTrend(data.days, completedRange, interval)
    : [];
  // 이전 기간의 날짜를 같은 위치로 이동한 후 묶어 월·주 경계에서도 비교 구간을 일치시킨다.
  const offset = previousRange
    ? (Date.parse(completedRange.startDate) -
        Date.parse(previousRange.startDate)) /
      86_400_000
    : 0;
  const previousTrend =
    hasCompletedPeriod && canCompare
      ? getTrend(
          previousDays.map((day) => ({
            ...day,
            date: shiftDate(day.date, offset),
          })),
          completedRange,
          interval,
        )
      : [];
  const validRatio = summary.totalImpressions
    ? (summary.impressions / summary.totalImpressions) * 100
    : null;
  const pending = validRange && range.endDate >= data.today;
  return {
    range,
    completedRange,
    setRange,
    interval,
    setInterval,
    metric,
    setMetric,
    compare,
    setCompare,
    validRange,
    rangeError,
    hasCompletedPeriod,
    days,
    previousRange,
    canCompare,
    previousDays,
    summary,
    previous,
    snapshot,
    trend,
    previousTrend,
    validRatio,
    pending,
  };
};
