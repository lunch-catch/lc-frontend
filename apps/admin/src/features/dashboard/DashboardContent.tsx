import { Link } from 'react-router';
import {
  Button,
  DateRangePicker,
  SegmentedControl,
  StatusBadge,
} from '@repo/ui';
import { formatDate, formatDateTime } from '@repo/utils';
import { Clock3, ExternalLink } from 'lucide-react';

import { DashboardBreakdown } from './DashboardBreakdown';
import { DashboardFunnel } from './DashboardFunnel';
import { DashboardMetricCard } from './DashboardMetricCard';
import { DashboardOverview } from './DashboardOverview';
import { DashboardRangeGuide } from './DashboardRangeGuide';
import { DashboardSection } from './DashboardSection';
import { DashboardTrendChart } from './DashboardTrendChart';
import type { DashboardDataset, DashboardInterval } from './dashboardTypes';
import { shiftDate } from './dashboardUtils';
import { useDashboard } from './useDashboard';
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
    days,
    summary,
    previous,
    snapshot,
    trend,
    canCompare,
    previousDays,
    previousRange,
    pending,
  } = report;
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
            <StatusBadge variant="neutral">예시 데이터</StatusBadge>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-caption-web text-text-secondary">
          <span className="inline-flex items-center gap-1.5">
            <Clock3 aria-hidden className="size-3.5" />
            마지막 집계 {formatDateTime(data.aggregatedAt)}
          </span>
          {validRange && (
            <span
              title={
                previousRange && canCompare
                  ? formatDate(previousRange.startDate) +
                    ' ~ ' +
                    formatDate(previousRange.endDate)
                  : undefined
              }
            >
              {snapshot ? formatDate(snapshot.date) + ' 기준 · ' : ''}
              {canCompare
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
          {pending && (
            <p
              role="status"
              className="rounded-lg bg-surface-subtle px-3 py-2 text-caption-web text-text-secondary"
            >
              오늘 데이터는 집계 중입니다. {formatDate(data.completedThrough)}
              까지 집계 완료된 날짜만 반영합니다.
            </p>
          )}
          {!hasCompletedPeriod ? (
            <div
              role="status"
              className="rounded-xl border border-border-subtle bg-bg-surface px-5 py-16 text-center text-body-sm-web text-text-secondary"
            >
              선택한 기간에는 집계 완료된 데이터가 없습니다.
            </div>
          ) : (
            <>
              <DashboardOverview
                summary={summary}
                previous={previous}
                snapshot={snapshot}
                previousSnapshot={canCompare ? previousDays.at(-1) : undefined}
                canCompare={canCompare}
                mismatchLink={mismatchLink}
              />
              <div className="grid items-stretch gap-4 xl:grid-cols-2">
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
                <DashboardSection
                  title="포인트 추이"
                  action={
                    <Link
                      to="/settlements?tab=sales"
                      className="inline-flex items-center gap-1 rounded-md text-caption-web text-text-secondary hover:text-text-brand focus-visible:outline-2 focus-visible:outline-action-primary"
                    >
                      매출 현황
                      <ExternalLink aria-hidden className="size-3.5 shrink-0" />
                    </Link>
                  }
                >
                  <div className="mb-4 grid grid-cols-2 gap-2">
                    <DashboardMetricCard
                      label="환불액"
                      basis="선택 기간 합계"
                      value={summary.refund}
                      unit="P"
                    />
                    <DashboardMetricCard
                      label="조정액"
                      basis="선택 기간 합계"
                      value={summary.adjustment}
                      unit="P"
                    />
                  </div>
                  <DashboardTrendChart
                    key={'points-' + interval + range.startDate + range.endDate}
                    title="충전·소진 추이"
                    labels={trend.map((point) => point.label)}
                    primary={{
                      name: '충전액',
                      values: trend.map((point) => point.charge),
                    }}
                    secondary={{
                      name: '소진액',
                      values: trend.map((point) => point.spend),
                    }}
                    unit="원"
                  />
                  <p className="mt-3 border-t border-border-subtle pt-3 text-caption-web text-text-secondary">
                    1P = 1원 · 소진액에 과오 차감 정정 반영
                  </p>
                </DashboardSection>
              </div>
              <DashboardBreakdown
                days={days}
                previousDays={previousDays}
                canCompare={canCompare}
              />
            </>
          )}
        </>
      )}
    </div>
  );
};

export const DashboardContent = () => {
  const state = useDashboard();
  return (
    <section aria-label="대시보드">
      <h2 className="sr-only">대시보드</h2>
      {state.status === 'loading' && (
        <div
          role="status"
          aria-live="polite"
          className="rounded-xl border border-border-subtle bg-bg-surface p-12 text-center text-body-sm-web text-text-secondary"
        >
          대시보드 집계 데이터를 불러오고 있습니다.
        </div>
      )}
      {state.status === 'error' && (
        <div
          role="alert"
          className="space-y-4 rounded-xl border border-border-subtle bg-bg-surface p-8 text-center"
        >
          <p className="text-body-sm-web text-text-secondary">
            집계 데이터를 불러오지 못했습니다. 다시 시도해 주세요.
          </p>
          <Button variant="neutral" onClick={state.retry}>
            다시 시도
          </Button>
        </div>
      )}
      {state.status === 'success' && <DashboardReport data={state.data} />}
    </section>
  );
};
