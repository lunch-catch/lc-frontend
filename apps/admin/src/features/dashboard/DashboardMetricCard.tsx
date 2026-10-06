import { StatusBadge, type StatusBadgeVariant } from '@repo/ui';
import { formatNumber } from '@repo/utils';
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';

import { getSparklinePoints } from './dashboardChartUtils';
import { getChangeLabel } from './dashboardUtils';

interface DashboardMetricCardProps {
  label: string;
  value: number;
  previous?: number;
  unit?: string;
  description?: string;
  selected?: boolean;
  onSelect?: () => void;
  values?: number[];
  variant?: 'card' | 'inset';
}

export const DashboardMetricCard = ({
  label,
  value,
  previous,
  unit = '건',
  description,
  selected = false,
  onSelect,
  values = [],
  variant = 'card',
}: DashboardMetricCardProps) => {
  const Container = onSelect ? 'button' : 'div';
  const direction = previous === undefined ? 0 : Math.sign(value - previous);
  const ChangeIcon =
    direction > 0 ? ArrowUpRight : direction < 0 ? ArrowDownRight : Minus;
  const points = getSparklinePoints(values);
  // 패널 안의 성장 지표는 테두리를 중복하지 않고 바깥 패널의 구분선을 사용한다.
  const surfaceClassName =
    variant === 'inset'
      ? 'py-2'
      : `rounded-xl border p-5 ${selected ? 'border-action-primary bg-surface-brand' : 'border-border-subtle bg-bg-surface'}`;
  const interactionClassName = onSelect
    ? 'cursor-pointer hover:border-action-primary focus-visible:outline-2 focus-visible:outline-action-primary'
    : '';
  const changeVariant: StatusBadgeVariant =
    direction > 0 ? 'success' : direction < 0 ? 'danger' : 'neutral';
  return (
    <Container
      {...(onSelect
        ? {
            type: 'button' as const,
            onClick: onSelect,
            'aria-pressed': selected,
          }
        : {})}
      className={`relative min-w-0 overflow-hidden text-left transition-colors ${surfaceClassName} ${interactionClassName}`}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-body-sm-web font-medium text-text-secondary">
          {label}
        </p>
        {selected && (
          <span
            className="size-2 rounded-full bg-action-primary"
            aria-hidden="true"
          />
        )}
      </div>
      <p className="mt-3 flex flex-wrap items-baseline gap-1 text-display-web font-semibold tracking-tight tabular-nums text-text-primary">
        {formatNumber(value)}
        <span className="text-body-sm-web font-normal text-text-secondary">
          {unit}
        </span>
      </p>
      {previous !== undefined && (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-caption-web">
          <StatusBadge variant={changeVariant} className="gap-1">
            <ChangeIcon className="size-3" aria-hidden="true" />
            {getChangeLabel(value, previous)}
          </StatusBadge>
          <span className="text-text-secondary">이전 기간 대비</span>
        </div>
      )}
      {description && (
        <p className="mt-2 text-caption-web text-text-secondary">
          {description}
        </p>
      )}
      {values.length > 1 && (
        <svg
          viewBox="0 0 100 36"
          preserveAspectRatio="none"
          className="mt-4 h-8 w-full"
          aria-hidden="true"
        >
          <polyline
            points={points}
            fill="none"
            stroke={
              selected
                ? 'var(--semantic-action-primary)'
                : 'var(--semantic-action-secondary)'
            }
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      )}
    </Container>
  );
};
