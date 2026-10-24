import { formatDate } from '@repo/utils';

import type { AnalyticsBucket } from '@admin/api/analytics';
import { shiftDate } from '@admin/api/analyticsDateUtils';

import type { FunnelMetric } from './dashboardTypes';

export { getKstToday } from '@admin/hooks/queryDateUtils';

/** API 조회 대기와 서버의 집계 미완료를 구분한다. */
export const getDashboardMetricHint = (resource: {
  loading: boolean;
  error?: string;
  data?: { items: AnalyticsBucket[] };
}) =>
  resource.loading
    ? '불러오는 중'
    : resource.error
      ? '조회 실패'
      : resource.data?.items.some((item) => item.status === 'IN_PROGRESS')
        ? '집계 미완료'
        : '데이터 없음';

export const funnelMetrics: { value: FunnelMetric; label: string }[] = [
  { value: 'issued', label: '발급' },
  { value: 'used', label: '사용' },
  { value: 'saves', label: '찜' },
  { value: 'impressions', label: '유효 노출' },
];

/** 증감률·비교 토글·범례에서 실제 이전 조회 기간을 같은 문구로 안내한다. */
export const getDashboardComparisonLabel = (series?: {
  from: string;
  to: string;
}) =>
  series
    ? formatDate(series.from) + ' ~ ' + formatDate(series.to) + ' 대비'
    : undefined;

export const getChangeLabel = (current: number, previous: number) => {
  if (previous === 0)
    return current === 0 ? '변동 없음' : '이전 기간 0 · 증감률 계산 불가';
  // 정정 내역으로 이전 소진액이 음수여도 증감 방향이 뒤집히지 않게 한다.
  const change = ((current - previous) / Math.abs(previous)) * 100;
  return `${change > 0 ? '+' : ''}${change.toFixed(1)}%`;
};

/** 부정 관리의 양끝 날짜 포함 31일 한도에 맞춰 종료일 기준으로 시작일만 줄인다. */
export const getFraudDetailQuery = (from: string, to: string) => {
  const earliest = shiftDate(to, -30);
  return new URLSearchParams({
    'fraud.from': from < earliest ? earliest : from,
    'fraud.to': to,
  }).toString();
};
