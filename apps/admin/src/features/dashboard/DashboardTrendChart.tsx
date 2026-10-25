import type { CSSProperties, PointerEvent } from 'react';
import {
  useCallback,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { formatNumber } from '@repo/utils';

import { DashboardChartPlot, type TrendSeries } from './DashboardChartPlot';
import {
  getDashboardChartGeometry,
  getNearestChartIndex,
} from './dashboardChartUtils';
const emptyTooltipDetails: TrendSeries[] = [];

interface DashboardTrendChartProps {
  title: string;
  labels: string[];
  primary: TrendSeries;
  secondary?: TrendSeries;
  /** 선이나 축에 포함하지 않고 같은 날짜의 툴팁에만 표시할 보조 지표. */
  tooltipDetails?: TrendSeries[];
  unit?: string;
  height?: number;
  variant?: 'line' | 'bar';
}

export const DashboardTrendChart = ({
  title,
  labels,
  primary,
  secondary,
  tooltipDetails = emptyTooltipDetails,
  unit = '건',
  height = 208,
  variant = 'line',
}: DashboardTrendChartProps) => {
  const id = useId();
  const chartRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const pointerY = useRef<number | null>(null);
  const [width, setWidth] = useState(640);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const hasLabels = labels.length > 0;
  useLayoutEffect(() => {
    const container = chartRef.current;
    if (!container) return;
    setWidth(
      Math.max(160, Math.round(container.getBoundingClientRect().width)),
    );
    // 패널 너비에 맞춰 좌표계를 바꿔 좁은 화면에서도 축 글자가 축소되지 않게 한다.
    const observer = new ResizeObserver(([entry]) => {
      setWidth(Math.max(160, Math.round(entry.contentRect.width)));
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [hasLabels]);
  const active = Math.min(activeIndex ?? labels.length - 1, labels.length - 1);
  const geometry = useMemo(
    () =>
      getDashboardChartGeometry(
        labels.length,
        width,
        height,
        variant,
        [...primary.values, ...(secondary?.values ?? [])].filter(
          (value): value is number => value !== null,
        ),
        Boolean(secondary),
      ),
    [labels.length, width, height, variant, primary.values, secondary],
  );
  const { x, y, bottom, chartLayout, firstX, pointWidth } = geometry;
  const valueLabel = (value: number | null | undefined) =>
    value == null ? '미확정' : formatNumber(value) + unit;
  const pendingFrame = useRef<number | null>(null);
  const pointer = useRef({ clientX: 0, clientY: 0 });
  const cancelPointerFrame = useCallback(() => {
    if (pendingFrame.current !== null)
      cancelAnimationFrame(pendingFrame.current);
    pendingFrame.current = null;
  }, []);
  useLayoutEffect(() => cancelPointerFrame, [cancelPointerFrame, geometry]);
  const moveTooltip = useCallback(
    (position: number) => {
      if (tooltipRef.current)
        tooltipRef.current.style.top =
          Math.min(bottom, Math.max(chartLayout.top, position)) + 'px';
    },
    [bottom, chartLayout.top],
  );
  useLayoutEffect(() => {
    if (pointerY.current !== null) moveTooltip(pointerY.current);
  }, [activeIndex, moveTooltip]);
  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    pointer.current = { clientX: event.clientX, clientY: event.clientY };
    if (pendingFrame.current !== null) return;
    // 한 프레임에 포인터 위치를 한 번만 읽고 툴팁·강조 표시만 갱신한다.
    pendingFrame.current = requestAnimationFrame(() => {
      pendingFrame.current = null;
      const bounds = chartRef.current?.getBoundingClientRect();
      if (!bounds) return;
      const position =
        ((pointer.current.clientX - bounds.left) / bounds.width) * width;
      pointerY.current = pointer.current.clientY - bounds.top;
      moveTooltip(pointerY.current);
      setActiveIndex(
        getNearestChartIndex(position, firstX, pointWidth, labels.length),
      );
    });
  };
  const focusPoint = useCallback(
    (index: number) => {
      cancelPointerFrame();
      pointerY.current = null;
      moveTooltip(y(primary.values[index] ?? 0));
      setActiveIndex(index);
    },
    [cancelPointerFrame, moveTooltip, y, primary.values],
  );
  const hidePointer = useCallback(() => {
    cancelPointerFrame();
    setActiveIndex(null);
    pointerY.current = null;
  }, [cancelPointerFrame]);
  const tooltipVisible = activeIndex !== null;
  // 툴팁은 활성 구간 옆에 붙이되 차트 오른쪽 절반에서는 왼쪽으로 뒤집어 잘리지 않게 한다.
  const tooltipFlipped = x(active) > width / 2;
  // 세로 위치는 툴팁 DOM에서만 갱신해 SVG 전체의 스타일 재계산을 피한다.
  const tooltipTop = Math.min(
    bottom,
    Math.max(chartLayout.top, y(primary.values[active] ?? 0)),
  );
  if (!labels.length)
    return (
      <p
        style={{ height }}
        className="flex items-center justify-center text-center text-body-sm-web text-text-secondary"
      >
        집계 완료된 데이터가 없습니다.
      </p>
    );
  return (
    <div className="space-y-3">
      <div
        ref={chartRef}
        className="relative rounded-lg bg-bg-surface"
        onPointerMove={handlePointerMove}
        onPointerLeave={hidePointer}
        style={
          { '--chart-bar-opacity': tooltipVisible ? 0.45 : 1 } as CSSProperties
        }
      >
        <DashboardChartPlot
          geometry={geometry}
          title={title}
          labels={labels}
          primary={primary}
          secondary={secondary}
          tooltipDetails={tooltipDetails}
          unit={unit}
          height={height}
          width={width}
          variant={variant}
          id={id}
          onPointFocus={focusPoint}
          onPointBlur={hidePointer}
        />
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute left-0 top-0 w-full"
          style={{ height }}
          viewBox={`0 0 ${width} ${height}`}
        >
          <line
            opacity={tooltipVisible ? 1 : 0}
            x1={x(active)}
            x2={x(active)}
            y1={chartLayout.top}
            y2={bottom}
            stroke="var(--semantic-text-tertiary)"
            strokeOpacity="0.5"
            strokeDasharray="4 4"
            pointerEvents="none"
          />

          {variant === 'bar' &&
            tooltipVisible &&
            primary.values[active] != null && (
              <rect
                x={x(active) - geometry.barWidth / 2}
                y={Math.min(y(primary.values[active]!), y(0))}
                width={geometry.barWidth}
                height={Math.abs(y(primary.values[active]!) - y(0))}
                rx={3}
                fill={`url(#${id}-bar)`}
              />
            )}
          <g pointerEvents="none" opacity={tooltipVisible ? 1 : 0}>
            <g opacity={primary.values[active] == null ? 0 : 1}>
              <circle
                cx={x(active)}
                cy={y(primary.values[active] ?? 0)}
                r="12"
                fill="var(--semantic-action-primary)"
                fillOpacity="0.12"
              />
              <circle
                cx={x(active)}
                cy={y(primary.values[active] ?? 0)}
                r="5"
                fill="var(--semantic-bg-surface)"
                stroke="var(--semantic-action-primary)"
                strokeWidth="2.5"
              />
            </g>
            {secondary && secondary.values[active] != null && (
              <circle
                cx={x(active)}
                cy={y(secondary.values[active] ?? 0)}
                r="4"
                fill="var(--semantic-bg-surface)"
                stroke="var(--semantic-action-secondary)"
                strokeWidth="2"
              />
            )}
          </g>
        </svg>
        {tooltipVisible && (
          <div
            ref={tooltipRef}
            aria-hidden
            className="pointer-events-none absolute z-10 w-max max-w-full rounded-lg whitespace-nowrap border border-border-subtle bg-bg-surface px-3 py-2 shadow-md"
            style={{
              left: x(active),
              top: tooltipTop,
              transform: `translate(${tooltipFlipped ? 'calc(-100% - 12px)' : '12px'}, -50%)`,
            }}
          >
            <p className="text-caption-web font-medium tabular-nums text-text-secondary">
              {labels[active]}
            </p>
            <div className="mt-1 space-y-1">
              {[primary, ...(secondary ? [secondary] : [])].map(
                (series, index) => (
                  <p
                    key={series.name}
                    className="flex items-center justify-between gap-3 text-caption-web text-text-secondary"
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className={
                          index === 0
                            ? 'h-1 w-4 rounded-full bg-action-primary'
                            : 'w-4 border-t-2 border-dashed border-action-secondary'
                        }
                      />
                      {series.name}
                    </span>
                    <span className="text-body-sm-web font-semibold tabular-nums text-text-primary">
                      {valueLabel(series.values[active])}
                    </span>
                  </p>
                ),
              )}
              {/* 보조 수치는 받은 일별 데이터로 표시하며 그래프 선과 축 계산에는 포함하지 않는다. */}
              {tooltipDetails.map((detail, index) => (
                <p
                  key={detail.name}
                  className={`flex items-center justify-between gap-3 text-caption-web text-text-secondary ${index === 0 ? 'mt-2 border-t border-border-subtle pt-2' : ''}`}
                >
                  <span>{detail.name}</span>
                  <span className="text-body-sm-web font-semibold tabular-nums text-text-primary">
                    {valueLabel(detail.values[active])}
                  </span>
                </p>
              ))}
            </div>
          </div>
        )}
      </div>
      {secondary && (
        <div className="flex flex-wrap justify-end gap-x-4 gap-y-1 text-caption-web text-text-secondary">
          <span className="inline-flex items-center gap-1.5">
            <span
              aria-hidden
              className={
                variant === 'bar'
                  ? 'h-2.5 w-2.5 rounded-sm bg-action-primary'
                  : 'h-0.5 w-4 bg-action-primary'
              }
            />
            {primary.name}
          </span>
          <span
            tabIndex={secondary.description ? 0 : undefined}
            aria-label={
              secondary.description
                ? secondary.name + ', ' + secondary.description
                : undefined
            }
            className="group/comparison relative inline-flex cursor-default items-center gap-1.5"
          >
            <span
              aria-hidden
              className="w-4 border-t-2 border-dashed border-action-secondary"
            />
            {secondary.name}
            {secondary.description && (
              <span
                role="tooltip"
                aria-hidden="true"
                className="pointer-events-none invisible absolute bottom-full right-0 z-40 mb-1 w-max max-w-[calc(100vw-2rem)] rounded-md border border-border-subtle bg-bg-surface px-2 py-1 text-caption-web text-text-primary shadow-sm group-hover/comparison:visible group-focus-visible/comparison:visible"
              >
                {secondary.description}
              </span>
            )}
          </span>
        </div>
      )}
      <div className="sr-only">
        <span>마우스 또는 키보드로 구간별 수치를 확인하세요.</span>
        <span>단위: {unit}</span>
      </div>
    </div>
  );
};
