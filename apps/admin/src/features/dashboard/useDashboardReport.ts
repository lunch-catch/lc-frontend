import { useState } from 'react';

import {
  getAnalyticsRangeError,
  shiftDate,
} from '@admin/api/analyticsDateUtils';
import { queryChoice, queryPastDate } from '@admin/hooks/urlQuery';
import { useUrlFilters } from '@admin/hooks/useUrlFilters';

import type { DashboardRange, FunnelMetric } from './dashboardTypes';
import { getKstToday } from './dashboardUtils';

export const useDashboardReport = () => {
  // API와 같은 KST 날짜를 기준으로 초기 조회 기간을 어제까지 7일로 잡는다.
  const [initialToday] = useState(getKstToday);
  const completedThrough = shiftDate(initialToday, -1);
  const { filters, updateFilters } = useUrlFilters('dashboard.', {
    view: queryChoice(['owners', 'members'] as const, 'owners'),
    from: queryPastDate(shiftDate(completedThrough, -6)),
    to: queryPastDate(completedThrough),
    preset: queryChoice(['7', '30', 'custom'] as const, '7'),
    metric: queryChoice(
      ['issued', 'used', 'impressions', 'saves'] as const,
      'issued',
    ),
    compare: queryChoice(['true', 'false'] as const, 'true'),
  });
  const maxDate = shiftDate(getKstToday(), -1);
  // 기존 URL에 오늘이 지정되어 있어도 어제까지만 조회한다.
  const range = {
    startDate: filters.from > maxDate ? maxDate : filters.from,
    endDate: filters.to > maxDate ? maxDate : filters.to,
  };
  // 대시보드는 일별 조회 한도(92일) 안에서 날짜 범위만 선택한다.
  const interval = 'day' as const;
  const { metric } = filters;
  const getPresetRange = (preset: '7' | '30') => {
    // 자정을 넘긴 뒤 프리셋을 다시 선택해도 그 시점의 KST 어제를 기준으로 계산한다.
    const completedThrough = shiftDate(getKstToday(), -1);
    return {
      startDate: shiftDate(completedThrough, 1 - Number(preset)),
      endDate: completedThrough,
    };
  };
  const presetRange =
    filters.preset === 'custom' ? null : getPresetRange(filters.preset);
  const preset =
    presetRange &&
    range.startDate === presetRange.startDate &&
    range.endDate === presetRange.endDate
      ? filters.preset
      : 'custom';
  const setPreset = (preset: '7' | '30' | 'custom') => {
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
  return {
    view: filters.view,
    setView: (view: 'owners' | 'members') => updateFilters({ view }),
    range,
    maxDate,
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
  };
};
