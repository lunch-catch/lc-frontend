import { formatNumber } from '@repo/utils';

import { getChangeLabel } from './dashboardUtils';

interface DashboardMetricCardProps {
  label: string;
  value: number;
  previous?: number;
  unit?: string;
  description?: string;
}

export const DashboardMetricCard = ({
  label,
  value,
  previous,
  unit = '건',
  description,
}: DashboardMetricCardProps) => (
  <div className="min-w-0 rounded-lg border border-border-subtle bg-bg-surface p-5">
    <p className="text-body-sm-web text-text-secondary">{label}</p>
    <p className="mt-3 flex flex-wrap items-baseline gap-1 text-h1 font-semibold tabular-nums text-text-primary">
      {formatNumber(value)}
      <span className="text-body-sm-web font-normal text-text-secondary">
        {unit}
      </span>
    </p>
    {previous !== undefined && (
      <p className="mt-3 text-caption-web text-text-secondary">
        이전 기간 대비{' '}
        <span className="font-medium text-text-primary">
          {getChangeLabel(value, previous)}
        </span>
      </p>
    )}
    {description && (
      <p className="mt-2 text-caption-web text-text-secondary">{description}</p>
    )}
  </div>
);
