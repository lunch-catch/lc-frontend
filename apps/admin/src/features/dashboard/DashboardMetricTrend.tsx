import type { ReactNode } from 'react';
import { formatDate, formatNumber } from '@repo/utils';

import type { AnalyticsBucket, AnalyticsSeries } from '@admin/api/analytics';

import { DashboardSection } from './DashboardSection';
import { DashboardTrendChart } from './DashboardTrendChart';
import { getDashboardMetricHint } from './dashboardUtils';

type NumericKey<T> = {
  [K in keyof T]: T[K] extends number | null ? K : never;
}[keyof T];
interface DashboardMetricTrendProps<T extends AnalyticsBucket> {
  title: string;
  resource: { data?: AnalyticsSeries<T>; loading: boolean; error?: string };
  primary: { name: string; field: NumericKey<T> };
  secondary?: { name: string; field: NumericKey<T> };
  tooltipMetrics?: { name: string; field: NumericKey<T> }[];
  unit: string;
  note?: string;
  action?: ReactNode;
  variant?: 'line' | 'bar';
  height?: number;
  featured?: boolean;
  rangeSelection?: boolean;
  snapshot?: {
    label: string;
    field: NumericKey<T>;
    unit: string;
    date: string;
  };
}

export const DashboardMetricTrend = <T extends AnalyticsBucket>({
  title,
  resource,
  primary,
  secondary,
  tooltipMetrics,
  unit,
  note,
  action,
  variant = 'line',
  height,
  featured,
  rangeSelection,
  snapshot,
}: DashboardMetricTrendProps<T>) => {
  const { data, loading, error } = resource;
  const rows = data?.items ?? [];
  // 잔액·누적값은 기간 합계가 아니라 조회 종료일에 해당하는 확정값만 표시한다.
  const snapshotRow = snapshot
    ? rows.find((row) => row.label === snapshot.date)
    : undefined;
  const snapshotValue =
    snapshot &&
    snapshotRow?.status === 'FINAL' &&
    typeof snapshotRow[snapshot.field] === 'number'
      ? (snapshotRow[snapshot.field] as number)
      : null;
  const series = (metric: typeof primary) => ({
    name: metric.name,
    values: rows.map((item) =>
      typeof item[metric.field] === 'number'
        ? (item[metric.field] as number)
        : null,
    ),
  });
  return (
    <DashboardSection
      title={title}
      description={note}
      action={action}
      featured={featured}
    >
      {snapshot && (
        <dl className="mb-4 flex min-h-14 flex-wrap items-center justify-between gap-2 border-b border-border-subtle pb-3">
          <dt className="text-body-sm-web font-medium text-text-secondary">
            {snapshot.label}
            <span className="mt-1 block text-caption-web font-normal text-text-tertiary">
              {formatDate(snapshot.date)} 기준
            </span>
          </dt>
          <dd className="flex min-h-9 items-baseline gap-1 text-h2-web font-semibold tabular-nums text-text-primary">
            {loading ? (
              <span className="text-body-sm-web font-normal text-text-secondary">
                불러오는 중
              </span>
            ) : snapshotValue === null ? (
              <span className="text-body-sm-web font-normal text-text-secondary">
                {getDashboardMetricHint(resource)}
              </span>
            ) : (
              <>
                {formatNumber(snapshotValue)}
                <span className="text-body-sm-web font-normal text-text-secondary">
                  {snapshot.unit}
                </span>
              </>
            )}
          </dd>
        </dl>
      )}
      <div className="min-h-52">
        {loading ? (
          <div
            role="status"
            aria-label="지표를 불러오고 있습니다."
            className="flex h-52 flex-col gap-3"
          >
            <div aria-hidden className="h-14 rounded-lg bg-bg-page" />
            <div
              aria-hidden
              className="flex flex-1 flex-col justify-between px-4 py-5"
            >
              {[0, 1, 2, 3, 4].map((line) => (
                <div
                  key={line}
                  className="border-t border-dashed border-border-subtle"
                />
              ))}
            </div>
          </div>
        ) : error ? (
          <p className="flex h-52 items-center justify-center text-body-sm-web text-text-secondary">
            지표를 조회하지 못했습니다.
          </p>
        ) : rows.length > 0 &&
          rows.every((row) => row.status === 'IN_PROGRESS') ? (
          <div
            role="status"
            className="flex h-52 flex-col items-center justify-center gap-2 text-body-sm-web text-text-secondary"
          >
            <p className="font-medium">집계 미완료</p>
            <p className="text-caption-web">
              선택한 기간의 통계가 아직 확정되지 않았습니다.
            </p>
          </div>
        ) : (
          <DashboardTrendChart
            // 조회 기간이 바뀌면 이전 그래프에서 선택한 날짜 인덱스도 초기화한다.
            key={`${data?.from}:${data?.to}`}
            rangeSelection={rangeSelection}
            variant={variant}
            height={height}
            title={title}
            labels={rows.map((item) => item.label)}
            primary={series(primary)}
            secondary={secondary ? series(secondary) : undefined}
            tooltipDetails={tooltipMetrics?.map(series)}
            unit={unit}
          />
        )}
      </div>
    </DashboardSection>
  );
};
