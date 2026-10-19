import { Link } from 'react-router';
import { Toggle } from '@repo/ui';
import { formatNumber } from '@repo/utils';
import { ExternalLink } from 'lucide-react';

import type { AnalyticsSeries, FunnelMetrics } from '@admin/api/analytics';
import { sumAnalytics } from '@admin/features/analytics/analyticsUtils';

import { DashboardMetricCard } from './DashboardMetricCard';
import { DashboardSection } from './DashboardSection';
import { DashboardTrendChart } from './DashboardTrendChart';
import type { FunnelMetric } from './dashboardTypes';
import { funnelMetrics } from './dashboardUtils';

interface FunnelResource {
  data?: AnalyticsSeries<FunnelMetrics>;
  loading: boolean;
  error?: string;
}
interface DashboardFunnelProps {
  resource: FunnelResource;
  previousResource: FunnelResource;
  metric: FunnelMetric;
  onMetricChange: (metric: FunnelMetric) => void;
  compare: boolean;
  onCompareChange: (value: boolean) => void;
}
const fields = {
  impressions: 'validImpressionCount',
  saves: 'wishCount',
  issued: 'issueCount',
  used: 'redeemCount',
} as const;
export const DashboardFunnel = ({
  resource,
  previousResource,
  metric,
  onMetricChange,
  compare,
  onCompareChange,
}: DashboardFunnelProps) => {
  const rows = resource.data?.items ?? [];
  const previous = previousResource.data?.items ?? [];
  const canCompare = rows.length > 0 && previous.length === rows.length;
  const selected = funnelMetrics.find((item) => item.value === metric)!;
  const valid = sumAnalytics(resource.data, 'validImpressionCount');
  const invalid = sumAnalytics(resource.data, 'invalidImpressionCount');
  // 구간별 비율을 평균 내지 않고 합산한 유효·무효 건수로 다시 계산한다.
  const ratio =
    valid !== null && invalid !== null && valid + invalid > 0
      ? valid / (valid + invalid)
      : null;
  const fraudQuery = resource.data
    ? new URLSearchParams({
        'fraud.from': resource.data.from,
        'fraud.to': resource.data.to,
      }).toString()
    : '';
  return (
    <DashboardSection
      title="이용 추이"
      action={
        <Toggle
          label="이전 기간 비교"
          checked={compare && canCompare}
          disabled={!canCompare}
          onChange={(event) => onCompareChange(event.target.checked)}
        />
      }
    >
      <div className="mb-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {funnelMetrics.map((item) => (
          <DashboardMetricCard
            key={item.value}
            label={item.label}
            value={sumAnalytics(resource.data, fields[item.value])}
            loading={resource.loading}
            emptyLabel={
              resource.error
                ? '조회 실패'
                : rows.some((row) => row.status === 'IN_PROGRESS')
                  ? '집계 중'
                  : '데이터 없음'
            }
            selected={metric === item.value}
            onSelect={() => onMetricChange(item.value)}
          />
        ))}
      </div>
      <div className="min-h-72">
        {resource.loading ? (
          <p
            role="status"
            className="flex h-72 items-center justify-center text-body-sm-web text-text-secondary"
          >
            이용 추이를 불러오고 있습니다.
          </p>
        ) : resource.error ? (
          <p className="flex h-72 items-center justify-center text-body-sm-web text-text-secondary">
            이용 추이를 조회하지 못했습니다.
          </p>
        ) : (
          <DashboardTrendChart
            title={selected.label + ' 추이'}
            labels={rows.map((row) => row.label)}
            primary={{
              name: selected.label,
              values: rows.map((row) => row[fields[metric]]),
            }}
            secondary={
              compare && canCompare
                ? {
                    name: '이전 기간',
                    values: previous.map((row) => row[fields[metric]]),
                  }
                : undefined
            }
          />
        )}
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border-subtle pt-3 text-caption-web text-text-secondary">
        <Link
          to={'/fraud' + (fraudQuery ? '?' + fraudQuery : '')}
          aria-label="무효 노출 상세 보기"
          className="inline-flex items-center gap-1 rounded-md hover:text-text-brand focus-visible:outline-2 focus-visible:outline-action-primary"
        >
          유효 노출 비율{' '}
          <strong className="font-semibold text-text-primary">
            {ratio === null ? '—' : (ratio * 100).toFixed(1) + '%'}
          </strong>
          <ExternalLink aria-hidden className="size-3.5" />
        </Link>
        <span>
          무효 노출 {invalid === null ? '—' : formatNumber(invalid)}건
        </span>
      </div>
      <p className="mt-2 text-caption-web text-text-secondary">
        찜은 피드 카드에서 발생한 건수입니다. 집계 중인 구간은 확정 수치와
        합계로 표시하지 않습니다.
      </p>
    </DashboardSection>
  );
};
