import { queryChoice, queryDate } from '@admin/hooks/urlQuery';
import { useUrlFilters } from '@admin/hooks/useUrlFilters';

import type {
  DashboardDataset,
  DashboardRange,
  FunnelMetric,
} from './dashboardTypes';
import {
  getAnalyticsRangeError,
  getPreviousRange,
  selectDays,
  shiftDate,
} from './dashboardUtils';

export const useDashboardReport = (data: DashboardDataset) => {
  const { filters, updateFilters } = useUrlFilters('dashboard.', {
    view: queryChoice(['owners', 'members'] as const, 'owners'),
    from: queryDate(shiftDate(data.completedThrough, -6)),
    to: queryDate(data.completedThrough),
    preset: queryChoice(['today', '7', '30', 'custom'] as const, '7'),
    metric: queryChoice(
      ['impressions', 'saves', 'issued', 'used'] as const,
      'impressions',
    ),
    compare: queryChoice(['true', 'false'] as const, 'true'),
  });
  const range = { startDate: filters.from, endDate: filters.to };
  // 대시보드는 일별 조회 한도(92일) 안에서 날짜 범위만 선택한다.
  const interval = 'day' as const;
  const { metric } = filters;
  const getPresetRange = (preset: 'today' | '7' | '30') =>
    preset === 'today'
      ? { startDate: data.today, endDate: data.today }
      : {
          startDate: shiftDate(data.completedThrough, 1 - Number(preset)),
          endDate: data.completedThrough,
        };
  const presetRange =
    filters.preset === 'custom' ? null : getPresetRange(filters.preset);
  const preset =
    presetRange &&
    range.startDate === presetRange.startDate &&
    range.endDate === presetRange.endDate
      ? filters.preset
      : 'custom';
  const setPreset = (preset: 'today' | '7' | '30' | 'custom') => {
    if (preset === 'custom') updateFilters({ preset });
    else {
      const next = getPresetRange(preset);
      updateFilters({ preset, from: next.startDate, to: next.endDate });
    }
  };
  const compare = filters.compare === 'true';
  const setRange = (value: DashboardRange) =>
    updateFilters({
      from: value.startDate,
      to: value.endDate,
      preset: 'custom',
    });
  const setMetric = (metric: FunnelMetric) => updateFilters({ metric });
  const setCompare = (compare: boolean) =>
    updateFilters({ compare: compare ? 'true' : 'false' });
  const rangeError = getAnalyticsRangeError(range, interval);
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
  const hasUsagePeriod =
    hasCompletedPeriod && completedRange.startDate >= data.availableFrom;
  const days = hasUsagePeriod ? selectDays(data.days, completedRange) : [];
  const previousRange = hasCompletedPeriod
    ? getPreviousRange(completedRange)
    : undefined;
  const canCompare = Boolean(
    previousRange &&
    previousRange.startDate >= data.availableFrom &&
    !getAnalyticsRangeError(previousRange, interval),
  );
  const previousDays =
    previousRange && canCompare ? selectDays(data.days, previousRange) : [];
  return {
    view: filters.view,
    setView: (view: 'owners' | 'members') => updateFilters({ view }),
    range,
    completedRange,
    setRange,
    interval,
    preset,
    setPreset,
    metric,
    setMetric,
    compare,
    setCompare,
    validRange,
    rangeError,
    hasCompletedPeriod,
    hasUsagePeriod,
    days,
    previousRange,
    canCompare,
    previousDays,
  };
};
