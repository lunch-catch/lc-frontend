import { Link } from 'react-router';
import { Button, DateRangePicker, SegmentedControl, Tabs } from '@repo/ui';
import { formatDateTime } from '@repo/utils';
import { Clock3, ExternalLink } from 'lucide-react';

import {
  getAnalyticsRangeError,
  getPreviousRange,
} from '@admin/api/analyticsDateUtils';
import { analyticsPeriods, sumAnalytics } from '@admin/api/analyticsUtils';

import { DashboardActionQueue } from './DashboardActionQueue';
import { DashboardFunnel } from './DashboardFunnel';
import { DashboardMetricCard } from './DashboardMetricCard';
import { DashboardMetricTrend } from './DashboardMetricTrend';
import { DashboardOverview } from './DashboardOverview';
import { DashboardSnapshots } from './DashboardSnapshots';
import { getDashboardMetricHint } from './dashboardUtils';
import { useDashboardMetrics } from './useDashboardMetrics';
import { useDashboardReport } from './useDashboardReport';

const DashboardReport = () => {
  const report = useDashboardReport();
  const { view, range, interval, validRange, rangeError } = report;
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
    metrics.funnel,
    metrics.previousFunnel,
    metrics.previousMembers,
    metrics.previousStores,
    metrics.previousSales,
  ].filter((state) => state.error);
  return (
    <div className="space-y-5">
      <DashboardActionQueue />
      <div className="relative z-30 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0 space-y-3">
          <div className="shrink-0">
            <Tabs
              items={[
                { value: 'owners', label: '점주 현황' },
                { value: 'members', label: '사용자 현황' },
              ]}
              value={view}
              onValueChange={(value) => {
                if (value === 'owners' || value === 'members')
                  report.setView(value);
              }}
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-caption-web text-text-secondary">
            <span className="inline-flex items-center gap-1.5">
              <Clock3 aria-hidden className="size-3.5" />
              {(view === 'members'
                ? [
                    ['회원', metrics.members.data?.aggregatedAt],
                    ['이용', metrics.funnel.data?.aggregatedAt],
                  ]
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
          </div>
        </div>
        <div
          className="ml-auto flex max-w-full flex-wrap items-center justify-end gap-2"
          aria-label="조회 기간 설정"
        >
          {report.preset === 'custom' && (
            <DateRangePicker
              ariaLabel="대시보드 조회 기간"
              selectionMode="day"
              value={range}
              onValueChange={report.setRange}
              placeholder="조회 기간 선택"
            />
          )}
          <SegmentedControl<'today' | '7' | '30' | 'custom'>
            ariaLabel="빠른 기간 선택"
            value={report.preset}
            items={[
              { value: 'today', label: '오늘' },
              { value: '7', label: '7일' },
              { value: '30', label: '30일' },
              { value: 'custom', label: '직접 선택' },
            ]}
            onValueChange={report.setPreset}
          />
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
          {view === 'members' ? (
            <>
              <DashboardFunnel
                resource={metrics.funnel}
                previousResource={metrics.previousFunnel}
                metric={report.metric}
                onMetricChange={report.setMetric}
                compare={report.compare}
                onCompareChange={report.setCompare}
              />
              <DashboardOverview metrics={metrics} view={view} />
              <div className="grid items-stretch gap-4 xl:grid-cols-2">
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
                <DashboardMetricTrend
                  title="신규 회원 추이"
                  resource={members}
                  primary={{ name: '신규 회원', field: 'newMemberCount' }}
                  unit="명"
                />
              </div>
            </>
          ) : (
            <>
              <DashboardMetricTrend
                title="매출·충전 추이"
                resource={sales}
                primary={{ name: '광고 매출', field: 'spentAmount' }}
                secondary={{ name: '충전액', field: 'chargeAmount' }}
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
              <DashboardOverview metrics={metrics} view={view} />
              <div className="grid items-stretch gap-4 xl:grid-cols-2">
                <DashboardMetricTrend
                  title="활성 캠페인 추이"
                  resource={stores}
                  primary={{
                    name: '활성 캠페인',
                    field: 'activeCampaignCount',
                  }}
                  unit="개"
                  note="각 날짜 말 기준 집행 중인 캠페인 수입니다."
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
                  loading={sales.loading}
                  emptyLabel={getDashboardMetricHint(sales)}
                  size="compact"
                />
                <DashboardMetricCard
                  label="조정액"
                  basis="선택 기간 합계"
                  value={sumAnalytics(sales.data, 'adjustAmount')}
                  unit="P"
                  loading={sales.loading}
                  emptyLabel={getDashboardMetricHint(sales)}
                  size="compact"
                />
              </div>
            </>
          )}
        </>
      )}
      <DashboardSnapshots view={view} />
    </div>
  );
};

export const DashboardContent = () => {
  return (
    <section aria-label="대시보드">
      <h2 className="sr-only">대시보드</h2>
      <DashboardReport />
    </section>
  );
};
