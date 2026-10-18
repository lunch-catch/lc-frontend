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
      {loading ? (
        <p
          role="status"
          className="py-12 text-center text-body-sm-web text-text-secondary"
        >
          지표를 불러오고 있습니다.
        </p>
      ) : error ? (
        <p className="py-12 text-center text-body-sm-web text-text-secondary">
          지표를 조회하지 못했습니다.
        </p>
      ) : (
        <DashboardTrendChart
          key={`${data?.period}:${data?.from}:${data?.to}`}
          title={title}
          labels={rows.map((item) => item.label)}
          primary={series(primary)}
          secondary={secondary ? series(secondary) : undefined}
          unit={unit}
        />
      )}
      {note && (
        <p className="mt-3 border-t border-border-subtle pt-3 text-caption-web text-text-secondary">
          {note}
        </p>
      )}
    </DashboardSection>
  );
};
