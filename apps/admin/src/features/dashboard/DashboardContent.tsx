import { Link } from 'react-router';
import {
  Button,
  DateRangePicker,
  SegmentedControl,
  StatusBadge,
  Toggle,
} from '@repo/ui';
import { formatNumber } from '@repo/utils';

import { DashboardBreakdown } from './DashboardBreakdown';
import { DashboardMetricCard } from './DashboardMetricCard';
import { DashboardSection } from './DashboardSection';
import { DashboardTrendChart } from './DashboardTrendChart';
import type {
  DashboardDataset,
  DashboardInterval,
  UsageMetric,
} from './dashboardTypes';
import { usageMetrics } from './dashboardUtils';
import { useDashboard } from './useDashboard';
import { useDashboardReport } from './useDashboardReport';

const detailLinkClassName =
  'rounded-md text-body-sm-web font-medium text-text-brand underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-action-primary';

const DashboardReport = ({ data }: { data: DashboardDataset }) => {
  const {
    range,
    setRange,
    interval,
    setInterval,
    metric,
    setMetric,
    compare,
    setCompare,
    validRange,
    hasCompletedPeriod,
    days,
    previousRange,
    canCompare,
    previousDays,
    summary,
    previous,
    snapshot,
    trend,
    previousTrend,
    selectedMetric,
    validRatio,
    pending,
  } = useDashboardReport(data);
  return (
    <div className="space-y-5">
      <div className="relative z-20 rounded-xl border border-border-subtle bg-bg-surface p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex min-w-0 max-w-full flex-wrap items-center gap-3">
            <SegmentedControl<DashboardInterval>
              ariaLabel="집계 표시 단위"
              value={interval}
              onValueChange={setInterval}
              items={[
                { label: '일별', value: 'day' },
                { label: '주별', value: 'week' },
                { label: '월별', value: 'month' },
              ]}
            />
            <div className="w-64 max-w-full">
              <DateRangePicker
                ariaLabel="대시보드 조회 기간"
                value={range}
                onValueChange={setRange}
                placeholder="조회 기간 선택"
              />
            </div>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3 text-caption-web text-text-secondary">
          <StatusBadge variant="info">목업 데이터</StatusBadge>
          <span>집계 완료 기준 {data.completedThrough}</span>
          <span>마지막 집계 {data.aggregatedAt}</span>
        </div>
      </div>
      {!validRange ? (
        <p
          role="status"
          className="rounded-lg bg-status-info-bg p-5 text-body-sm-web text-status-info-fg"
        >
          시작일과 종료일을 선택해주세요. 한 번에 최대 366일을 조회할 수
          있습니다.
        </p>
      ) : (
        <>
          {pending && (
            <p
              role="status"
              className="rounded-lg bg-status-info-bg p-4 text-body-sm-web text-status-info-fg"
            >
              오늘 데이터는 집계 중입니다. 오늘 이후 날짜를 제외한 완료 기간의
              수치만 표시합니다.
            </p>
          )}
          {!hasCompletedPeriod ? (
            <p
              role="status"
              className="rounded-lg bg-bg-surface p-8 text-center text-body-sm-web text-text-secondary"
            >
              선택한 기간에는 집계 완료된 날짜가 없습니다.
            </p>
          ) : (
            <>
              {summary.mismatchCount > 0 && (
                <div
                  role="status"
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-status-warning-border bg-status-warning-bg p-4 text-body-sm-web text-status-warning-fg"
                >
                  <p>
                    원장 불일치 {formatNumber(summary.mismatchCount)}건이
                    있습니다. 포인트 현황은 원장 기준 집계값으로 표시합니다.
                  </p>
                  <Link className={detailLinkClassName} to="/settlements">
                    포인트·정산 확인 →
                  </Link>
                </div>
              )}
              <section aria-label="서비스 이용 현황" className="space-y-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="text-h2-web font-semibold">
                    서비스 이용 현황
                  </h3>
                  <p className="text-caption-web text-text-secondary">
                    {previousRange && canCompare
                      ? `이전 기간 ${previousRange.startDate} ~ ${previousRange.endDate}`
                      : '이전 기간의 비교 집계가 없습니다.'}
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {usageMetrics.map((item) => (
                    <DashboardMetricCard
                      key={item.value}
                      label={`${item.label} 수`}
                      value={summary[item.value]}
                      previous={canCompare ? previous[item.value] : undefined}
                      selected={metric === item.value}
                      onSelect={() => setMetric(item.value)}
                      values={trend.map((point) => point[item.value])}
                    />
                  ))}
                </div>
              </section>
              {/* 추이와 성장 지표는 같은 패널 구조로 묶고 데스크톱에서 높이를 맞춘다. */}
              <div className="grid items-stretch gap-5 xl:grid-cols-3">
                <div className="flex min-w-0 xl:col-span-2 [&>section]:w-full">
                  <DashboardSection
                    title="서비스 이용 추이"
                    description="선택한 지표의 변화를 이전 기간과 비교합니다."
                    action={
                      <Toggle
                        label="이전 기간 비교"
                        checked={compare && canCompare}
                        disabled={!canCompare}
                        onChange={(event) => setCompare(event.target.checked)}
                      />
                    }
                  >
                    <div className="mb-5">
                      <SegmentedControl<UsageMetric>
                        ariaLabel="이용 추이 지표"
                        items={usageMetrics}
                        value={metric}
                        onValueChange={setMetric}
                      />
                    </div>
                    <DashboardTrendChart
                      key={`${metric}-${interval}-${range.startDate}-${range.endDate}`}
                      title={`${selectedMetric.label} 추이`}
                      labels={trend.map((point) => point.label)}
                      primary={{
                        name: selectedMetric.label,
                        values: trend.map((point) => point[metric]),
                      }}
                      secondary={
                        compare && canCompare
                          ? {
                              name: '이전 기간 (동일 길이)',
                              values: previousTrend.map(
                                (point) => point[metric],
                              ),
                            }
                          : undefined
                      }
                    />
                  </DashboardSection>
                </div>
                <DashboardSection
                  title="플랫폼 성장"
                  description="선택 기간의 신규 가입과 입점 현황입니다."
                >
                  <div className="grid gap-6 divide-y divide-border-subtle [&>div+div]:pt-6">
                    {/* 신규 수는 기간 합계이며 전체 수는 마지막 집계일의 값이다. */}
                    <DashboardMetricCard
                      variant="inset"
                      label="신규 가입자 수"
                      value={summary.newUsers}
                      previous={canCompare ? previous.newUsers : undefined}
                      unit="명"
                      description={
                        snapshot
                          ? `${snapshot.date} 기준 전체 사용자 ${formatNumber(snapshot.totalUsers)}명 · 점주 계정 제외`
                          : '해당 기간 집계 없음'
                      }
                    />
                    <DashboardMetricCard
                      variant="inset"
                      label="신규 입점 가게 수"
                      value={summary.newStores}
                      previous={canCompare ? previous.newStores : undefined}
                      unit="개"
                      description={
                        snapshot
                          ? `${snapshot.date} 기준 등록 완료 가게 ${formatNumber(snapshot.totalStores)}개`
                          : '해당 기간 집계 없음'
                      }
                    />
                  </div>
                </DashboardSection>
              </div>
              <DashboardBreakdown
                days={days}
                previousDays={previousDays}
                canCompare={canCompare}
              />
              <DashboardSection
                title="포인트 현황"
                description="충전액과 소진액은 기간 합계, 미소진 잔액은 마지막 집계 완료일의 잔액 + 예약 중 포인트입니다."
                action={
                  <Link className={detailLinkClassName} to="/settlements">
                    포인트·정산 상세 보기 →
                  </Link>
                }
              >
                <div className="mb-5 grid gap-4 lg:grid-cols-3">
                  <DashboardMetricCard
                    label="충전액"
                    value={summary.charge}
                    previous={canCompare ? previous.charge : undefined}
                    unit="원"
                  />
                  <DashboardMetricCard
                    label="소진액"
                    value={summary.spend}
                    previous={canCompare ? previous.spend : undefined}
                    unit="P"
                  />
                  <DashboardMetricCard
                    label="미소진 잔액"
                    value={snapshot?.unspent ?? 0}
                    unit="P"
                    description={
                      snapshot
                        ? `${snapshot.date} 기준 · 일별 잔액을 합산하지 않습니다.`
                        : '해당 기간 집계 없음'
                    }
                  />
                </div>
                <DashboardTrendChart
                  key={`points-${interval}-${range.startDate}-${range.endDate}`}
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
                <p className="mt-3 text-caption-web text-text-secondary">
                  1P = 1원 기준으로 충전액과 소진액을 비교합니다.
                </p>
              </DashboardSection>
              <DashboardSection
                title="플랫폼 상태"
                description="선택 기간의 노출 유효성과 포인트 집계 일치 여부를 확인합니다."
              >
                <div className="grid gap-6 lg:grid-cols-2">
                  <div className="space-y-3">
                    <p className="text-body-sm-web text-text-secondary">
                      유효 노출 비율
                    </p>
                    <p className="text-h1 font-semibold tabular-nums">
                      {validRatio.toFixed(1)}%
                    </p>
                    <div
                      role="meter"
                      aria-label="유효 노출 비율"
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={validRatio}
                      className="h-2 overflow-hidden rounded-full bg-surface-subtle"
                    >
                      <div
                        className="h-full rounded-full bg-action-primary"
                        style={{ width: `${validRatio}%` }}
                      />
                    </div>
                    <p className="text-caption-web text-text-secondary">
                      유효 노출 {formatNumber(summary.impressions)}건 / 전체
                      노출 이벤트 {formatNumber(summary.totalImpressions)}건
                    </p>
                    <Link className={detailLinkClassName} to="/fraud">
                      무효 노출 상세 보기 →
                    </Link>
                  </div>
                  <div className="space-y-3">
                    <p className="text-body-sm-web text-text-secondary">
                      원장 불일치 건수
                    </p>
                    <div className="flex items-center gap-3">
                      <p className="text-h1 font-semibold tabular-nums">
                        {formatNumber(summary.mismatchCount)}건
                      </p>
                      <StatusBadge
                        variant={summary.mismatchCount ? 'warning' : 'success'}
                      >
                        {summary.mismatchCount ? '확인 필요' : '불일치 없음'}
                      </StatusBadge>
                    </div>
                    <p className="text-caption-web text-text-secondary">
                      집계 결과와 원장을 비교한 불일치 건수입니다.
                    </p>
                    <Link className={detailLinkClassName} to="/settlements">
                      원장·집계 내역 확인 →
                    </Link>
                  </div>
                </div>
              </DashboardSection>
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
    <section className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-display-web font-semibold text-text-primary">
            대시보드
          </h2>
          <p className="mt-2 text-body-sm-web text-text-secondary">
            서비스 이용 흐름과 지역별 변화, 포인트 현황을 한눈에 확인합니다.
          </p>
        </div>
      </header>
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
            집계 데이터를 불러오지 못했습니다. 다시 시도해주세요.
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
