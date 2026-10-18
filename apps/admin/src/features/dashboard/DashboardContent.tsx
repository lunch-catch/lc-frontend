import { useState } from 'react';
import { Link } from 'react-router';
import { Button, DateRangePicker, SegmentedControl, Tabs } from '@repo/ui';
import { formatDate, formatDateTime } from '@repo/utils';
import { Clock3, ExternalLink } from 'lucide-react';

import { getMockDashboardUsage } from '@admin/api/mocks/dashboardUsage';
import {
  getAnalyticsRangeError,
  getPreviousRange,
  shiftDate,
} from '@admin/features/analytics/analyticsDateUtils';
import {
  analyticsPeriods,
  sumAnalytics,
} from '@admin/features/analytics/analyticsUtils';

import { DashboardActionQueue } from './DashboardActionQueue';
import { DashboardBreakdown } from './DashboardBreakdown';
import { DashboardFunnel } from './DashboardFunnel';
import { DashboardMetricCard } from './DashboardMetricCard';
import { DashboardMetricTrend } from './DashboardMetricTrend';
import { DashboardOverview, DashboardSnapshots } from './DashboardOverview';
import { DashboardRangeGuide } from './DashboardRangeGuide';
import type { DashboardDataset, DashboardInterval } from './dashboardTypes';
import { useDashboardMetrics } from './useDashboardMetrics';
import { useDashboardReport } from './useDashboardReport';

const DashboardReport = ({ data }: { data: DashboardDataset }) => {
  const report = useDashboardReport(data);
  const {
    view,
    range,
    interval,
    validRange,
    rangeError,
    hasUsagePeriod,
    days,
    summary,
    trend,
    canCompare,
    previousDays,
  } = report;
  const query = validRange
    ? {
        period: analyticsPeriods[interval],
        from: range.startDate,
        to: range.endDate,
      }
    : null;
  const comparison = validRange ? getPreviousRange(range) : null;
  const metrics = useDashboardMetrics(
    query,
    query && comparison && !getAnalyticsRangeError(comparison, interval)
      ? { ...query, from: comparison.startDate, to: comparison.endDate }
      : null,
    view,
  );
  const { members, stores, sales } = metrics;
  const failures = [
    members,
    stores,
    sales,
    metrics.previousMembers,
    metrics.previousStores,
    metrics.previousSales,
  ].filter((state) => state.error);
  return (
    <div className="space-y-5">
      <DashboardActionQueue />
      <Tabs
        items={[
          { value: 'owners', label: '점주 현황' },
          { value: 'members', label: '사용자 현황' },
        ]}
        value={view}
        onValueChange={(value) => {
          if (value === 'owners' || value === 'members') report.setView(value);
        }}
      />
      <div className="relative z-30 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <SegmentedControl<DashboardInterval>
              ariaLabel="집계 표시 단위"
              value={interval}
              onValueChange={report.setInterval}
              items={[
                { label: '일별', value: 'day' },
                { label: '주별', value: 'week' },
                { label: '월별', value: 'month' },
              ]}
            />
            <DateRangePicker
              ariaLabel="대시보드 조회 기간"
              selectionMode={interval}
              value={range}
              onValueChange={report.setRange}
              placeholder="조회 기간 선택"
            />
            <DashboardRangeGuide />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div
              className="flex items-center gap-1"
              aria-label="빠른 기간 선택"
            >
              {[7, 30, 90].map((length) => {
                const startDate = shiftDate(data.completedThrough, 1 - length);
                const selected =
                  range.startDate === startDate &&
                  range.endDate === data.completedThrough;
                return (
                  <button
                    key={length}
                    type="button"
                    aria-pressed={selected}
                    onClick={() =>
                      report.setRange({
                        startDate,
                        endDate: data.completedThrough,
                      })
                    }
                    className={
                      'rounded-md px-3 py-2 text-caption-web font-medium transition-colors focus-visible:outline-2 focus-visible:outline-action-primary ' +
                      (selected
                        ? 'bg-surface-brand text-text-brand'
                        : 'text-text-secondary hover:bg-surface-subtle')
                    }
                  >
                    최근 {length}일
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-caption-web text-text-secondary">
          <span className="inline-flex items-center gap-1.5">
            <Clock3 aria-hidden className="size-3.5" />
            {(view === 'members'
              ? [['회원', metrics.members.data?.aggregatedAt]]
              : [
                  ['입점', metrics.stores.data?.aggregatedAt],
                  ['매출', metrics.sales.data?.aggregatedAt],
                ]
            )
              .map(
                ([name, at]) =>
                  name + ' 집계 ' + (at ? formatDateTime(at) : '—'),
              )
              .join(' · ')}
          </span>
          {validRange && (
            <span
              title={
                comparison && !getAnalyticsRangeError(comparison, interval)
                  ? formatDate(comparison.startDate) +
                    ' ~ ' +
                    formatDate(comparison.endDate)
                  : undefined
              }
            >
              {comparison && !getAnalyticsRangeError(comparison, interval)
                ? '직전 동일 기간 대비'
                : '이전 기간 비교 데이터 없음'}
            </span>
          )}
        </div>
      </div>
      {!validRange ? (
        <p
          role="alert"
          className="rounded-lg border border-status-warning-border bg-status-warning-bg p-4 text-body-sm-web text-status-warning-fg"
        >
          {rangeError}
        </p>
      ) : (
        <>
          {failures.length > 0 && (
            <div
              role="alert"
              className="flex flex-wrap items-center gap-3 text-body-sm-web text-status-danger-fg"
            >
              일부 지표를 불러오지 못했습니다. {failures[0].error}
              <Button
                variant="neutral"
                onClick={() => failures.forEach((state) => state.retry())}
              >
                다시 시도
              </Button>
            </div>
          )}
          <DashboardOverview metrics={metrics} view={view} />
          {view === 'members' ? (
            <>
              <div className="grid items-stretch gap-4 xl:grid-cols-2">
                <DashboardMetricTrend
                  title="신규 회원 추이"
                  resource={members}
                  primary={{ name: '신규 회원', field: 'newMemberCount' }}
                  unit="명"
                />
                <DashboardMetricTrend
                  title="활성 회원 추이"
                  resource={members}
                  primary={{
                    name: '일평균 활성 회원',
                    field: 'avgDailyActiveMembers',
                  }}
                  unit="명"
                  note="각 구간의 일평균입니다. 주간·월간 순수 활성 회원 수와는 다릅니다."
                />
              </div>
              {hasUsagePeriod ? (
                <>
                  <DashboardFunnel
                    summary={summary}
                    trend={trend}
                    previousTrend={report.previousTrend}
                    metric={report.metric}
                    onMetricChange={report.setMetric}
                    compare={report.compare}
                    canCompare={canCompare}
                    onCompareChange={report.setCompare}
                    validRatio={report.validRatio}
                  />
                  <DashboardBreakdown
                    days={days}
                    previousDays={previousDays}
                    canCompare={canCompare}
                  />
                </>
              ) : (
                <p className="text-body-sm-web text-text-secondary">
                  선택한 기간에는 이용현황 예시 데이터가 없습니다.
                </p>
              )}
            </>
          ) : (
            <>
              <div className="grid items-stretch gap-4 xl:grid-cols-2">
                <DashboardMetricTrend
                  title="충전·소진 추이"
                  resource={sales}
                  primary={{ name: '충전액', field: 'chargeAmount' }}
                  secondary={{ name: '소진액', field: 'spentAmount' }}
                  unit="원"
                  note="1P = 1원 · 소진액에는 과오 차감 정정이 반영됩니다."
                  action={
                    <Link
                      to="/settlements?tab=sales"
                      className="inline-flex items-center gap-1 rounded-md text-caption-web text-text-secondary hover:text-text-brand focus-visible:outline-2 focus-visible:outline-action-primary"
                    >
                      매출 현황
                      <ExternalLink aria-hidden className="size-3.5" />
                    </Link>
                  }
                />
                <DashboardMetricTrend
                  title="신규 입점 추이"
                  resource={stores}
                  primary={{ name: '신규 입점 가게', field: 'newStoreCount' }}
                  unit="개"
                  note="선택한 구간에 최종 등록한 가게 수입니다."
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <DashboardMetricCard
                  label="환불액"
                  basis="선택 기간 합계"
                  value={sumAnalytics(sales.data, 'refundAmount')}
                  unit="원"
                  size="compact"
                />
                <DashboardMetricCard
                  label="조정액"
                  basis="선택 기간 합계"
                  value={sumAnalytics(sales.data, 'adjustAmount')}
                  unit="P"
                  size="compact"
                />
              </div>
            </>
          )}
          <DashboardSnapshots metrics={metrics} view={view} />
        </>
      )}
    </div>
  );
};

export const DashboardContent = () => {
  const [usageData] = useState(getMockDashboardUsage);
  return (
    <section aria-label="대시보드">
      <h2 className="sr-only">대시보드</h2>
      <DashboardReport data={usageData} />
    </section>
  );
};
