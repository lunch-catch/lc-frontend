import type { ReactNode } from 'react';
import { formatNumber } from '@repo/utils';
import { ArrowDownRight, ArrowUpRight, CircleCheck, Minus } from 'lucide-react';

import { DashboardSparkline } from './DashboardSparkline';
import { getChangeLabel } from './dashboardUtils';

interface DashboardMetricCardProps {
  label: ReactNode;
  value: number | null;
  previous?: number | null;
  emptyLabel?: string;
  unit?: string;
  basis?: string;
  description?: string;
  loading?: boolean;
  emphasis?: boolean;
  size?: 'default' | 'compact';
  selected?: boolean;
  onSelect?: () => void;
  trend?: (number | null)[];
  layout?: 'stacked' | 'inline';
}

export const DashboardMetricCard = ({
  label,
  value,
  previous,
  emptyLabel = '데이터 없음',
  unit = '건',
  basis,
  description,
  loading = false,
  emphasis = false,
  size = 'default',
  selected = false,
  onSelect,
  trend,
  layout = 'stacked',
}: DashboardMetricCardProps) => {
  const Container = onSelect ? 'button' : 'div';
  const canCompare = value !== null && previous != null;
  const direction = canCompare ? Math.sign(value - previous) : 0;
  const ChangeIcon =
    direction > 0 ? ArrowUpRight : direction < 0 ? ArrowDownRight : Minus;
  // 배경을 채우면 강조로만 읽혀서, 테두리와 체크로 선택 상태를 드러낸다.
  const surfaceClassName = selected
    ? 'border-action-primary bg-bg-surface ring-1 ring-inset ring-action-primary'
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

  const valueNode = (
    <p
      className={`flex min-w-0 flex-wrap items-baseline gap-1 font-semibold tracking-tight tabular-nums ${layout === 'inline' ? 'text-h2-web leading-tight' : 'text-h1 leading-tight'} ${emphasis && value !== null ? 'text-text-brand' : 'text-text-primary'}`}
    >
      {loading ? (
        <>
          <span className="sr-only">불러오는 중</span>
          <span
            aria-hidden
            className="inline-block h-6 w-20 rounded bg-surface-subtle"
          />
        </>
      ) : value === null ? (
        // 큰 굵은 글씨의 대시는 두꺼운 막대처럼 보여서 사유 문구만 보여준다.
        <span className="text-body-sm-web font-normal text-text-secondary">
          {emptyLabel}
        </span>
      ) : (
        <>
          {formatNumber(value)}
          <span className="text-body-sm-web font-normal text-text-secondary">
            {unit}
          </span>
        </>
      )}
    </p>
  );
  const selectedIcon = selected && (
    <CircleCheck aria-hidden className="size-4 shrink-0 text-action-primary" />
  );

  return (
    <Container
      {...(onSelect
        ? {
            type: 'button' as const,
            onClick: onSelect,
            'aria-pressed': selected,
          }
        : {})}
      className={`relative min-w-0 overflow-hidden rounded-xl border text-left transition-colors ${size === 'compact' || layout === 'inline' ? 'px-4 py-3' : 'p-4'} ${surfaceClassName} ${interactionClassName}`}
    >
      {/* 수치는 왼쪽에, 이전 기간 대비 증감은 오른쪽 추이선과 함께 표시한다. */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="min-w-0 flex-1">
          {layout === 'inline' ? (
            <p className="flex items-center gap-1.5 text-h3-web leading-tight font-semibold whitespace-nowrap text-text-primary">
              {label}
              {selectedIcon}
            </p>
          ) : (
            <p className="flex min-w-0 flex-wrap items-baseline gap-x-1.5 text-body-sm-web font-medium text-text-secondary">
              {label}
              {basis && (
                <span className="text-caption-web font-normal text-text-tertiary">
                  {basis}
                </span>
              )}
              {selectedIcon}
            </p>
          )}
          <div className="mt-1">{valueNode}</div>
          {description && (
            <p className="mt-1 text-caption-web text-text-secondary">
              {description}
            </p>
          )}
        </div>
        {!loading && (trend || canCompare) && (
          <div className="ml-auto flex w-2/5 min-w-16 max-w-44 flex-col items-end gap-1">
            {trend && (
              <DashboardSparkline values={trend} className="h-12 w-full" />
            )}
            {canCompare && (
              <p
                className={`inline-flex items-center gap-1 text-caption-web ${changeTextClassName}`}
                title="이전 기간 대비"
              >
                <ChangeIcon className="size-3 shrink-0" aria-hidden />
                {getChangeLabel(value, previous)}
                <span className="sr-only">이전 기간 대비</span>
              </p>
            )}
          </div>
        )}
      </div>
    </Container>
  );
};
