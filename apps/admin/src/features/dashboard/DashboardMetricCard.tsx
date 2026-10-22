import type { ReactNode } from 'react';
import { formatNumber } from '@repo/utils';
import {
  ArrowDownRight,
  ArrowUpRight,
  ChevronRight,
  Minus,
} from 'lucide-react';

import { DashboardSparkline } from './DashboardSparkline';
import { getChangeLabel } from './dashboardUtils';

interface DashboardMetricCardProps {
  label: ReactNode;
  value: number | null;
  previous?: number | null;
  comparisonLabel?: string;
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
  footer?: ReactNode;
}

export const DashboardMetricCard = ({
  label,
  value,
  previous,
  comparisonLabel = '이전 기간 대비',
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
  footer,
}: DashboardMetricCardProps) => {
  const Container = onSelect ? 'button' : 'div';
  // 이전 값이 0이면 증감률을 정의할 수 없으므로 방향 아이콘도 함께 숨긴다.
  const canCompare =
    !loading && value !== null && previous != null && previous !== 0;
  const hasAside = trend !== undefined || previous !== undefined;
  const direction = canCompare ? Math.sign(value - previous) : 0;
  const ChangeIcon =
    direction > 0 ? ArrowUpRight : direction < 0 ? ArrowDownRight : Minus;
  const surfaceClassName = selected
    ? 'border-text-tertiary bg-bg-surface ring-1 ring-inset ring-border-subtle shadow-sm'
    : 'border-border-subtle bg-bg-surface';
  const interactionClassName = onSelect
    ? 'cursor-pointer focus-visible:outline-2 focus-visible:outline-action-primary'
    : '';
  const paddingClassName = onSelect
    ? 'py-2 pl-4 pr-10'
    : size === 'compact' || layout === 'inline'
      ? 'px-4 py-2'
      : 'p-4';
  const changeTextClassName =
    direction > 0
      ? 'text-status-success-fg'
      : direction < 0
        ? 'text-status-danger-fg'
        : 'text-text-secondary';

  const valueNode = (
    <p
      className={`flex min-h-8 min-w-0 flex-wrap content-center items-baseline gap-1 text-h1 leading-tight font-semibold tracking-tight tabular-nums ${emphasis && value !== null ? 'text-text-brand' : 'text-text-primary'}`}
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
  const card = (
    <Container
      {...(onSelect
        ? {
            type: 'button' as const,
            onClick: onSelect,
            'aria-pressed': selected,
          }
        : {})}
      className={`group relative flex min-h-20 min-w-0 items-center overflow-hidden text-left transition-colors ${footer ? '' : `rounded-xl border ${surfaceClassName}`} ${paddingClassName} ${interactionClassName}`}
    >
      {onSelect && (
        <ChevronRight
          aria-hidden
          strokeWidth={3}
          className={`pointer-events-none absolute right-2.5 top-1/2 size-5 -translate-y-1/2 text-text-secondary transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 motion-reduce:transition-none ${selected ? 'opacity-100' : 'opacity-0'}`}
        />
      )}
      {/* 최소 높이가 남더라도 수치와 추이 영역을 함께 가운데 정렬한다. */}
      <div className="flex w-full items-center gap-4">
        <div
          className={
            layout === 'inline' ? 'min-w-fit flex-1' : 'min-w-0 flex-1'
          }
        >
          {layout === 'inline' ? (
            <p className="flex items-center gap-1.5 text-body-sm-web font-normal whitespace-nowrap text-text-secondary">
              {label}
            </p>
          ) : (
            <p className="flex min-w-0 flex-wrap items-baseline gap-x-1.5 text-body-sm-web font-normal text-text-secondary">
              {label}
              {basis && (
                <span className="text-caption-web font-normal text-text-tertiary">
                  {basis}
                </span>
              )}
            </p>
          )}
          <div className={layout === 'inline' ? 'mt-0' : 'mt-1'}>
            {valueNode}
          </div>
          {description && (
            <p className="mt-1 text-caption-web text-text-secondary">
              {description}
            </p>
          )}
        </div>
        {hasAside && (
          <div
            className={`ml-auto flex max-w-44 flex-col items-end gap-1 pr-2 ${layout === 'inline' ? 'w-1/3 min-w-10' : 'w-2/5 min-w-16'}`}
          >
            {previous !== undefined && (
              <div className="min-h-4">
                {canCompare && (
                  <p
                    className={`inline-flex items-center gap-1 text-caption-web ${changeTextClassName}`}
                    title={comparisonLabel}
                  >
                    <ChangeIcon className="size-3 shrink-0" aria-hidden />
                    {getChangeLabel(value, previous)}
                    <span className="sr-only">{comparisonLabel}</span>
                  </p>
                )}
              </div>
            )}
            {trend !== undefined && (
              // 미집계·빈 추이에도 그래프 자리를 유지해 카드 높이가 바뀌지 않게 한다.
              <div className="h-8 w-full">
                {!loading && (
                  <DashboardSparkline values={trend} className="h-8 w-full" />
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </Container>
  );
  // 선택 버튼과 하단 링크를 형제 요소로 두어 인터랙티브 요소가 중첩되지 않게 한다.
  return footer ? (
    <div
      className={`flex min-w-0 flex-col overflow-hidden rounded-xl border ${surfaceClassName}`}
    >
      {card}
      <div className="flex min-h-8 items-center border-t border-border-subtle px-4 py-1.5 text-caption-web text-text-secondary">
        {footer}
      </div>
    </div>
  ) : (
    card
  );
};
