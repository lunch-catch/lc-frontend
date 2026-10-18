import type { ReactNode } from 'react';

import type { AnalyticsBucket, AnalyticsSeries } from '@admin/api/analytics';

import { DashboardSection } from './DashboardSection';
import { DashboardTrendChart } from './DashboardTrendChart';

type NumericKey<T> = {
  [K in keyof T]: T[K] extends number | null ? K : never;
}[keyof T];
interface DashboardMetricTrendProps<T extends AnalyticsBucket> {
  title: string;
  resource: { data?: AnalyticsSeries<T>; loading: boolean; error?: string };
  primary: { name: string; field: NumericKey<T> };
  secondary?: { name: string; field: NumericKey<T> };
  unit: string;
  note?: string;
  action?: ReactNode;
}

export const DashboardMetricTrend = <T extends AnalyticsBucket>({
  title,
  resource,
  primary,
  secondary,
  unit,
  note,
  action,
}: DashboardMetricTrendProps<T>) => {
  const { data, loading, error } = resource;
  const rows = data?.items ?? [];
  const series = (metric: typeof primary) => ({
    name: metric.name,
    values: rows.map((item) =>
      typeof item[metric.field] === 'number'
        ? (item[metric.field] as number)
        : null,
    ),
  });
  return (
    <DashboardSection title={title} action={action}>
      <div className="min-h-72">
        {loading ? (
          <div
            role="status"
            aria-label="지표를 불러오고 있습니다."
            className="flex h-72 flex-col gap-3"
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
          <p className="flex h-72 items-center justify-center text-body-sm-web text-text-secondary">
            지표를 조회하지 못했습니다.
          </p>
        ) : (
          <DashboardTrendChart
            title={title}
            labels={rows.map((item) => item.label)}
            primary={series(primary)}
            secondary={secondary ? series(secondary) : undefined}
            unit={unit}
          />
        )}
      </div>
      {note && (
        <p className="mt-3 border-t border-border-subtle pt-3 text-caption-web text-text-secondary">
          {note}
        </p>
      )}
    </DashboardSection>
  );
};
