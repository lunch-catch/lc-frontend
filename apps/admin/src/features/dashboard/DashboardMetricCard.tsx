import type { ReactNode } from 'react';
import { formatNumber } from '@repo/utils';
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';

import { getChangeLabel } from './dashboardUtils';

interface DashboardMetricCardProps {
  label: ReactNode;
  value: number;
  previous?: number;
  unit?: string;
  basis?: string;
  description?: string;
  selected?: boolean;
  onSelect?: () => void;
}

export const DashboardMetricCard = ({
  label,
  value,
  previous,
  unit = '건',
  basis,
  description,
  selected = false,
  onSelect,
}: DashboardMetricCardProps) => {
  const Container = onSelect ? 'button' : 'div';
  const direction = previous === undefined ? 0 : Math.sign(value - previous);
  const ChangeIcon =
    direction > 0 ? ArrowUpRight : direction < 0 ? ArrowDownRight : Minus;
  const surfaceClassName = selected
    ? 'border-action-primary bg-surface-brand'
    : 'border-border-subtle bg-bg-surface';
  const interactionClassName = onSelect
    ? 'cursor-pointer hover:border-action-primary focus-visible:outline-2 focus-visible:outline-action-primary'
    : '';
  const changeTextClassName =
    direction > 0
      ? 'text-status-success-fg'
      : direction < 0
        ? 'text-status-danger-fg'
        : 'text-text-secondary';

  return (
    <Container
      {...(onSelect
        ? {
            type: 'button' as const,
            onClick: onSelect,
            'aria-pressed': selected,
          }
        : {})}
      className={`relative min-w-0 overflow-hidden rounded-xl border p-4 text-left transition-colors ${surfaceClassName} ${interactionClassName}`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 text-body-sm-web font-medium text-text-secondary">
          {label}
        </p>
        {basis && (
          <p className="ml-auto text-right text-caption-web text-text-secondary">
            {basis}
          </p>
        )}
        {selected && (
          <span
            className="mt-1 shrink-0 size-2 rounded-full bg-action-primary"
            aria-hidden="true"
          />
        )}
      </div>
      <p className="mt-2 flex flex-wrap items-baseline gap-1 text-h2-web font-semibold tracking-tight tabular-nums text-text-primary sm:text-h1">
        {formatNumber(value)}
        <span className="text-body-sm-web font-normal text-text-secondary">
          {unit}
        </span>
      </p>
      {(previous !== undefined || description) && (
        <div className="mt-2 flex flex-wrap items-center justify-between gap-x-2 gap-y-1 text-caption-web">
          {previous !== undefined && (
            <span
              className={`inline-flex items-center gap-1 ${changeTextClassName}`}
            >
              <ChangeIcon className="size-3" aria-hidden />
              {getChangeLabel(value, previous)}
              <span className="sr-only">이전 기간 대비</span>
            </span>
          )}
          {description && (
            <span className="ml-auto text-right text-text-secondary">
              {description}
            </span>
          )}
        </div>
      )}
    </Container>
  );
};
