import { Link } from 'react-router';
import { Button, SegmentedControl, Tabs } from '@repo/ui';
import { formatDateTime } from '@repo/utils';
import { ExternalLink } from 'lucide-react';

import {
  getAnalyticsRangeError,
  getPreviousRange,
} from '@admin/api/analyticsDateUtils';
import { analyticsPeriods } from '@admin/api/analyticsUtils';
import { AdminDateRangePicker } from '@admin/ui/DatePicker/AdminDateRangePicker';

import { DashboardActionQueue } from './DashboardActionQueue';
import { DashboardFunnel } from './DashboardFunnel';
import { DashboardMetricTrend } from './DashboardMetricTrend';
import { DashboardOverview } from './DashboardOverview';
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
  // 현재 탭이 조회한 지표 중 가장 최근의 집계 완료 시각을 표시한다.
  const aggregatedAt = (
    view === 'members'
      ? [members.data?.aggregatedAt, metrics.funnel.data?.aggregatedAt]
      : [stores.data?.aggregatedAt, sales.data?.aggregatedAt]
  )
    .filter((at): at is string => Boolean(at))
    .sort((a, b) => Date.parse(b) - Date.parse(a))[0];
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
    <div className="space-y-4">
      <DashboardActionQueue />
      <div className="relative z-30 flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
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
        <div className="ml-auto flex max-w-full flex-col items-end gap-1.5">
          <p className="text-right text-caption-web text-text-tertiary">
            마지막 집계 {aggregatedAt ? formatDateTime(aggregatedAt) : '—'}
          </p>
          <div
            className="ml-auto flex max-w-full flex-wrap items-center justify-end gap-2"
            aria-label="조회 기간 설정"
          >
            <AdminDateRangePicker
              ariaLabel="대시보드 조회 기간"
              selectionMode="day"
              maxDate={report.maxDate}
              value={range}
              onValueChange={report.setRange}
              placeholder="조회 기간 선택"
            />
            <SegmentedControl<'7' | '30' | 'custom'>
              ariaLabel="빠른 기간 선택"
              value={report.preset}
              items={[
                { value: '7', label: '최근 일주일' },
                { value: '30', label: '최근 한달' },
                { value: 'custom', label: '직접 선택' },
              ]}
              onValueChange={report.setPreset}
            />
          </div>
        </div>
      </div>
      <section aria-label="기간 지표" className="space-y-4">
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
                <div className="grid items-stretch gap-4 xl:grid-cols-2">
                  <DashboardMetricTrend
                    title="활성 회원 추이"
                    tooltipMetrics={[
                      { name: '정지 회원', field: 'suspendedCount' },
                    ]}
                    resource={members}
                    primary={{
                      name: '일평균 활성 회원',
                      field: 'avgDailyActiveMembers',
                    }}
                    unit="명"
                    note="일별 활성 회원과 정지 회원 수를 확인할 수 있습니다."
                  />
                  <DashboardMetricTrend
                    title="신규 회원 추이"
                    note="일별 신규 회원 수와 선택한 기간의 합계를 확인할 수 있습니다."
                    tooltipMetrics={[
                      { name: '누적 회원', field: 'cumulativeMemberCount' },
                      { name: '누적 탈퇴', field: 'withdrawnCount' },
                    ]}
                    rangeSelection
                    variant="bar"
                    resource={members}
                    primary={{ name: '신규 회원', field: 'newMemberCount' }}
                    unit="명"
                  />
                </div>
              </>
            ) : (
              <>
                <DashboardOverview metrics={metrics} />
                <DashboardMetricTrend
                  title="매출·충전 추이"
                  featured
                  variant="bar"
                  height={280}
                  resource={sales}
                  primary={{ name: '광고 매출', field: 'spentAmount' }}
                  secondary={{ name: '충전액', field: 'chargeAmount' }}
                  unit="원"
                  note="일별 광고 매출과 충전액을 비교할 수 있습니다."
                  snapshot={{
                    label: '미소진 잔액',
                    field: 'unspentBalance',
                    unit: 'P',
                    date: range.endDate,
                  }}
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
                <div className="grid items-stretch gap-4 xl:grid-cols-2">
                  <DashboardMetricTrend
                    title="활성 캠페인 추이"
                    resource={stores}
                    primary={{
                      name: '활성 캠페인',
                      field: 'activeCampaignCount',
                    }}
                    unit="개"
                    note="날짜별 집행 중인 캠페인 수를 확인할 수 있습니다."
                  />
                  <DashboardMetricTrend
                    title="신규 입점 추이"
                    rangeSelection
                    tooltipMetrics={[
                      { name: '누적 입점 업체', field: 'cumulativeStoreCount' },
                    ]}
                    variant="bar"
                    resource={stores}
                    primary={{
                      name: '신규 입점 가게',
                      field: 'newStoreCount',
                    }}
                    unit="개"
                    note="일별 신규 입점 가게 수와 선택한 기간의 합계를 확인할 수 있습니다."
                  />
                </div>
              </>
            )}
          </>
        )}
      </section>
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
