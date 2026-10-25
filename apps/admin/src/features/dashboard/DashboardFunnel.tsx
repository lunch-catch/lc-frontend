import { useId } from 'react';
import { Link } from 'react-router';
import { Toggle } from '@repo/ui';
import { formatNumber } from '@repo/utils';
import { ExternalLink } from 'lucide-react';

import type { AnalyticsSeries, FunnelMetrics } from '@admin/api/analytics';
import { sumAnalytics } from '@admin/api/analyticsUtils';

import { DashboardMetricCard } from './DashboardMetricCard';
import { DashboardSection } from './DashboardSection';
import { DashboardTrendChart } from './DashboardTrendChart';
import type { FunnelMetric } from './dashboardTypes';
import {
  funnelMetrics,
  getDashboardComparisonLabel,
  getDashboardMetricHint,
  getFraudDetailQuery,
} from './dashboardUtils';

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
  const comparisonLabel = getDashboardComparisonLabel(previousResource.data);
  const comparisonHint =
    comparisonLabel ??
    (previousResource.loading
      ? '이전 기간 데이터를 불러오는 중입니다.'
      : '이전 기간 데이터가 없어 비교할 수 없습니다.');
  const selected = funnelMetrics.find((item) => item.value === metric)!;
  const valid = sumAnalytics(resource.data, 'validImpressionCount');
  const invalid = sumAnalytics(resource.data, 'invalidImpressionCount');
  // 구간별 비율을 평균 내지 않고 합산한 유효·무효 건수로 다시 계산한다.
  const ratio =
    valid !== null && invalid !== null && valid + invalid > 0
      ? valid / (valid + invalid)
      : null;
  const fraudQuery = resource.data
    ? getFraudDetailQuery(resource.data.from, resource.data.to)
    : '';
  // 합계는 전체 선택 기간을 유지하고 링크가 조회할 기간만 별도로 표시한다.
  const fraudPeriod = fraudQuery ? new URLSearchParams(fraudQuery) : null;
  // aria-label이 링크 본문을 대신 읽으므로 보이는 조회 기간은 설명으로 연결한다.
  const fraudPeriodId = useId();
  const comparisonHintId = useId();
  return (
    <DashboardSection
      title="사용자 이용 현황"
      featured
      description="발급·사용·찜·유효 노출 건수와 일별 변화를 확인할 수 있습니다."
      // title의 브라우저 표시 지연 없이 호버·키보드 포커스로 비교 기간을 안내한다.
      action={
        <span
          className="group/comparison relative inline-flex cursor-default"
          tabIndex={canCompare ? undefined : 0}
          aria-describedby={comparisonHintId}
        >
          <Toggle
            label="이전 기간 비교"
            aria-describedby={comparisonHintId}
            checked={compare && canCompare}
            disabled={!canCompare}
            onChange={(event) => onCompareChange(event.target.checked)}
          />
          <span
            id={comparisonHintId}
            role="tooltip"
            className="pointer-events-none invisible absolute right-0 top-full z-40 mt-1 w-max max-w-[calc(100vw-2rem)] rounded-md border border-border-subtle bg-bg-surface px-2 py-1 text-caption-web text-text-primary shadow-sm group-hover/comparison:visible group-focus-within/comparison:visible"
          >
            {comparisonHint}
          </span>
        </span>
      }
    >
      {/* 행동별 합계를 비교하며, 서로 다른 행동 사이의 전환율로 해석하지 않는다. */}
      <div className="grid items-start gap-4 xl:grid-cols-[minmax(240px,280px)_minmax(0,1fr)]">
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
          {funnelMetrics.map((item) => (
            <DashboardMetricCard
              key={item.value}
              label={item.label}
              value={sumAnalytics(resource.data, fields[item.value])}
              loading={resource.loading}
              emptyLabel={getDashboardMetricHint(resource)}
              emphasis={metric === item.value}
              selected={metric === item.value}
              onSelect={() => onMetricChange(item.value)}
              trend={rows.map((row) => row[fields[item.value]])}
              layout="inline"
              footer={
                item.value === 'impressions' ? (
                  <Link
                    to={'/fraud' + (fraudQuery ? '?' + fraudQuery : '')}
                    aria-label="무효 노출 상세 보기"
                    aria-describedby={fraudPeriod ? fraudPeriodId : undefined}
                    title="부정 관리는 선택한 기간의 마지막 최대 31일을 조회합니다."
                    className="group/impression-detail inline-flex flex-wrap items-center gap-x-1.5 gap-y-1 rounded hover:text-text-brand focus-visible:text-text-brand focus-visible:outline-2 focus-visible:outline-action-primary"
                  >
                    <span className="whitespace-nowrap">
                      유효 비율{' '}
                      <strong className="font-semibold text-text-primary group-hover/impression-detail:text-text-brand group-focus-visible/impression-detail:text-text-brand">
                        {ratio === null ? '—' : (ratio * 100).toFixed(1) + '%'}
                      </strong>
                    </span>
                    <span aria-hidden>·</span>
                    <span className="whitespace-nowrap">
                      무효{' '}
                      <strong className="font-semibold text-text-primary group-hover/impression-detail:text-text-brand group-focus-visible/impression-detail:text-text-brand">
                        {invalid === null ? '—' : formatNumber(invalid)}건
                      </strong>
                    </span>
                    <ExternalLink aria-hidden className="size-3.5 shrink-0" />
                    {fraudPeriod && (
                      <span
                        id={fraudPeriodId}
                        className="basis-full text-caption-web leading-5 text-text-secondary group-hover/impression-detail:text-text-brand group-focus-visible/impression-detail:text-text-brand"
                      >
                        조회 기간: {fraudPeriod.get('fraud.from')} ~{' '}
                        {fraudPeriod.get('fraud.to')}
                        {fraudPeriod.get('fraud.from') !==
                          resource.data?.from && ' (마지막 31일)'}
                      </span>
                    )}
                  </Link>
                ) : undefined
              }
            />
          ))}
        </div>
        <div className="min-h-52 min-w-0 rounded-xl bg-bg-surface p-2 sm:p-4">
          <h4 className="mb-2 text-body-sm-web font-medium text-text-primary">
            {selected.label} 일별 추이
          </h4>
          {resource.loading ? (
            <p
              role="status"
              className="flex h-full min-h-52 items-center justify-center text-body-sm-web text-text-secondary"
            >
              이용 추이를 불러오고 있습니다.
            </p>
          ) : resource.error ? (
            <p className="flex h-full min-h-52 items-center justify-center text-body-sm-web text-text-secondary">
              이용 추이를 조회하지 못했습니다.
            </p>
          ) : rows.length > 0 &&
            rows.every((row) => row.status === 'IN_PROGRESS') ? (
            <div
              role="status"
              className="flex h-full min-h-52 flex-col items-center justify-center gap-2 text-body-sm-web text-text-secondary"
            >
              <p className="font-medium">집계 미완료</p>
              <p className="text-caption-web">
                선택한 기간의 통계가 아직 확정되지 않았습니다.
              </p>
            </div>
          ) : (
            <DashboardTrendChart
              height={320}
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
                      description: comparisonLabel,
                      values: previous.map((row) => row[fields[metric]]),
                    }
                  : undefined
              }
            />
          )}
        </div>
      </div>
    </DashboardSection>
  );
};
