import { useEffect, useState } from 'react';

import {
  getMemberMetrics,
  getSales,
  getStoreMetrics,
} from '@admin/api/analytics';
import { shiftDate } from '@admin/api/analyticsDateUtils';
import { queryPastDate } from '@admin/hooks/urlQuery';
import { useAnalyticsQuery } from '@admin/hooks/useAnalyticsQuery';
import { useUrlFilters } from '@admin/hooks/useUrlFilters';

import { getKstToday } from './dashboardUtils';

/** 차트 기간과 별도로 기준일 하루의 누적·잔액 스냅샷을 조회한다. */
export const useDashboardSnapshots = (view: 'owners' | 'members') => {
  const [today, setToday] = useState(getKstToday);
  // 화면을 켜 둔 채 KST 자정을 넘기거나 절전에서 돌아와도 선택 상한을 갱신한다.
  useEffect(() => {
    const refreshToday = () => setToday(getKstToday());
    const nextMidnight = Date.parse(`${shiftDate(today, 1)}T00:00:00+09:00`);
    const timer = window.setTimeout(
      refreshToday,
      Math.max(0, nextMidnight - Date.now()),
    );
    window.addEventListener('focus', refreshToday);
    document.addEventListener('visibilitychange', refreshToday);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('focus', refreshToday);
      document.removeEventListener('visibilitychange', refreshToday);
    };
  }, [today]);
  const maxDate = shiftDate(today, -1);
  const { filters, updateFilters } = useUrlFilters('snapshot.', {
    date: queryPastDate(maxDate),
  });
  // URL 직접 입력으로도 오늘·미래 날짜를 조회하지 못하도록 상한을 적용한다.
  const date = filters.date && filters.date <= maxDate ? filters.date : maxDate;
  const query = { period: 'DAILY' as const, from: date, to: date };
  const members = useAnalyticsQuery(
    getMemberMetrics,
    view === 'members' ? query : null,
  );
  const stores = useAnalyticsQuery(
    getStoreMetrics,
    view === 'owners' ? query : null,
  );
  const sales = useAnalyticsQuery(getSales, view === 'owners' ? query : null);
  return {
    date,
    maxDate,
    setDate: (value: string) => {
      const latest = shiftDate(getKstToday(), -1);
      if (value && value > latest) return;
      // 초기화하면 빈 조회 대신 기본 기준일인 어제로 돌아간다.
      updateFilters({ date: value || latest });
    },
    members,
    stores,
    sales,
  };
};
