import { useState } from 'react';
import { Link } from 'react-router';
import { Button, DateRangePicker, SegmentedControl } from '@repo/ui';
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

import { DashboardBreakdown } from './DashboardBreakdown';
import { DashboardFunnel } from './DashboardFunnel';
import { DashboardMetricCard } from './DashboardMetricCard';
import { DashboardOverview } from './DashboardOverview';
import { DashboardRangeGuide } from './DashboardRangeGuide';
import { DashboardSection } from './DashboardSection';
import { DashboardTrendChart } from './DashboardTrendChart';
import type { DashboardDataset, DashboardInterval } from './dashboardTypes';
import { useDashboardMetrics } from './useDashboardMetrics';
import { useDashboardReport } from './useDashboardReport';

const DashboardReport = ({ data }: { data: DashboardDataset }) => {
  const report = useDashboardReport(data);
  const {
    range,
    completedRange,
    interval,
    validRange,
    rangeError,
    hasCompletedPeriod,
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
    query && hasCompletedPeriod
      ? { ...query, to: completedRange.endDate }
      : null,
  );
  const sales = metrics.sales;
  const failures = [
    metrics.members,
    metrics.stores,
    sales,
    metrics.mismatches,
    metrics.previousMembers,
    metrics.previousStores,
    metrics.previousSales,
  ].filter((state) => state.error);
  const mismatchLink =
    '/settlements?' +
    new URLSearchParams({
      tab: 'mismatches',
      'mismatches.from': range.startDate,
      'mismatches.to': completedRange.endDate,
    });

  return (
    <div className="space-y-4">
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
            {[
              ['회원', metrics.members.data?.aggregatedAt],
              ['입점', metrics.stores.data?.aggregatedAt],
              ['매출', sales.data?.aggregatedAt],
            ]
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
          <DashboardOverview metrics={metrics} mismatchLink={mismatchLink} />
          <div className="grid items-stretch gap-4 xl:grid-cols-2">
            {hasUsagePeriod ? (
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
            ) : (
              <p className="rounded-xl border border-border-subtle bg-bg-surface p-5 text-body-sm-web text-text-secondary">
                선택한 기간에는 이용현황 예시 데이터가 없습니다.
              </p>
            )}
            <DashboardSection
              title="포인트 추이"
              action={
                <Link
                  to="/settlements?tab=sales"
                  className="inline-flex items-center gap-1 text-caption-web text-text-secondary hover:text-text-brand"
                >
                  매출 현황
                  <ExternalLink aria-hidden className="size-3.5" />
                </Link>
              }
            >
              <div className="mb-4 grid grid-cols-2 gap-2">
                <DashboardMetricCard
                  label="환불액"
                  basis="선택 기간 합계"
                  value={sumAnalytics(sales.data, 'refundAmount')}
                  unit="원"
                />
                <DashboardMetricCard
                  label="조정액"
                  basis="선택 기간 합계"
                  value={sumAnalytics(sales.data, 'adjustAmount')}
                  unit="P"
                />
              </div>
              {sales.loading ? (
                <p role="status">매출 데이터를 불러오는 중입니다.</p>
              ) : sales.error ? (
                <p>매출 데이터를 조회하지 못했습니다.</p>
              ) : (
                <DashboardTrendChart
                  key={'points-' + interval + range.startDate + range.endDate}
                  title="충전·소진 추이"
                  labels={(sales.data?.items ?? []).map((item) => item.label)}
                  primary={{
                    name: '충전액',
                    values: (sales.data?.items ?? []).map(
                      (item) => item.chargeAmount,
                    ),
                  }}
                  secondary={{
                    name: '소진액',
                    values: (sales.data?.items ?? []).map(
                      (item) => item.spentAmount,
                    ),
                  }}
                  unit="원"
                />
              )}
              <p className="mt-3 border-t border-border-subtle pt-3 text-caption-web text-text-secondary">
                1P = 1원 · 집계 중이거나 값이 없는 구간은 합계와 그래프 수치를
                표시하지 않습니다.
              </p>
            </DashboardSection>
          </div>
          {hasUsagePeriod && (
            <DashboardBreakdown
              days={days}
              previousDays={previousDays}
              canCompare={canCompare}
            />
          )}
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
