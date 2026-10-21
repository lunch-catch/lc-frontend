import { useState } from 'react';

import {
  getAnalyticsRangeError,
  shiftDate,
} from '@admin/api/analyticsDateUtils';
import { queryChoice, queryDate } from '@admin/hooks/urlQuery';
import { useUrlFilters } from '@admin/hooks/useUrlFilters';

import type { DashboardRange, FunnelMetric } from './dashboardTypes';

const getKstToday = () =>
  new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Seoul' }).format(
    new Date(),
  );

export const useDashboardReport = () => {
  // API와 같은 KST 날짜를 기준으로 초기 조회 기간을 어제까지 7일로 잡는다.
  const [initialToday] = useState(getKstToday);
  const completedThrough = shiftDate(initialToday, -1);
  const { filters, updateFilters } = useUrlFilters('dashboard.', {
    view: queryChoice(['owners', 'members'] as const, 'owners'),
    from: queryDate(shiftDate(completedThrough, -6)),
    to: queryDate(completedThrough),
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
  const getPresetRange = (preset: 'today' | '7' | '30') => {
    if (preset === 'today') {
      // 화면을 켜 둔 채 자정을 넘겨도 선택 시점의 KST 날짜로 조회한다.
      const today = getKstToday();
      return { startDate: today, endDate: today };
    }
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
  return {
    view: filters.view,
    setView: (view: 'owners' | 'members') => updateFilters({ view }),
    range,
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
