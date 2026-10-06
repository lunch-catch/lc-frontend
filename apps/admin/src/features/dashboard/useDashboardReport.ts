import { useState } from 'react';

import type {
  DashboardDataset,
  DashboardInterval,
  DashboardRange,
  UsageMetric,
} from './dashboardTypes';
import {
  getPreviousRange,
  getTrend,
  selectDays,
  shiftDate,
  summarizeDays,
  usageMetrics,
} from './dashboardUtils';

export const useDashboardReport = (data: DashboardDataset) => {
  const [range, setRange] = useState<DashboardRange>({
    startDate: shiftDate(data.completedThrough, -13),
    endDate: data.completedThrough,
  });
  const [interval, setInterval] = useState<DashboardInterval>('day');
  const [metric, setMetric] = useState<UsageMetric>('impressions');
  const [compare, setCompare] = useState(true);
  const validRange = Boolean(
    range.startDate &&
    range.endDate &&
    range.startDate <= range.endDate &&
    (Date.parse(range.endDate) - Date.parse(range.startDate)) / 86_400_000 <
      366,
  );
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
    previousRange && previousRange.startDate >= data.availableFrom,
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
  const selectedMetric = usageMetrics.find((item) => item.value === metric)!;
  const validRatio = summary.totalImpressions
    ? (summary.impressions / summary.totalImpressions) * 100
    : 0;
  const pending = validRange && range.endDate >= data.today;
  return {
    range,
    setRange,
    interval,
    setInterval,
    metric,
    setMetric,
    compare,
    setCompare,
    validRange,
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
    selectedMetric,
    validRatio,
    pending,
  };
};
