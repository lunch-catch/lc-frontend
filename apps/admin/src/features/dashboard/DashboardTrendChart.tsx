import type { PointerEvent } from 'react';
import { useId, useLayoutEffect, useRef, useState } from 'react';
import { formatNumber } from '@repo/utils';

import {
  getChartAxisMaximum,
  getChartLabelInterval,
  getNearestChartIndex,
} from './dashboardChartUtils';

const comparisonLayout = { left: 64, right: 32, top: 20 };
const singleSeriesLayout = { left: 40, right: 12, top: 12 };
const axisFormatter = new Intl.NumberFormat('ko-KR', { notation: 'compact' });

interface TrendSeries {
  name: string;
  values: (number | null)[];
}

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
  tooltipDetails = [],
  unit = '건',
  height = 208,
  variant = 'line',
}: DashboardTrendChartProps) => {
  // 단일 지표는 범례와 넓은 여백을 덜어내고 축 라벨에 필요한 공간만 남긴다.
  const chartLayout = secondary ? comparisonLayout : singleSeriesLayout;
  const bottom = height - 28;
  const labelY = height - 8;
  const id = useId();
  const chartRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(640);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [pointerY, setPointerY] = useState<number | null>(null);
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
  const tickInterval = getChartLabelInterval(labels.length, width);
  const values = [...primary.values, ...(secondary?.values ?? [])].filter(
    (value): value is number => value !== null,
  );
  const max = getChartAxisMaximum(values);
  // 과오 차감 정정으로 소진액이 음수가 될 수 있어 0 아래 구간도 표시한다.
  const min =
    Math.min(0, ...values) < 0
      ? -getChartAxisMaximum(values.map((value) => -value))
      : 0;
  const plotWidth = width - chartLayout.left - chartLayout.right;
  // 막대는 날짜별 칸의 중앙에 놓아 첫·마지막 막대도 축 경계 안에 들어오게 한다.
  const slotWidth = plotWidth / Math.max(1, labels.length);
  const firstX = chartLayout.left + (variant === 'bar' ? slotWidth / 2 : 0);
  const pointWidth = plotWidth - (variant === 'bar' ? slotWidth : 0);
  const x = (index: number) =>
    labels.length === 1
      ? chartLayout.left + plotWidth / 2
      : firstX + (index * pointWidth) / (labels.length - 1);
  const y = (value: number) =>
    bottom - ((value - min) / (max - min)) * (bottom - chartLayout.top);
  const barWidth = Math.max(
    1,
    Math.min(32, (plotWidth / labels.length) * 0.55),
  );
  // 미확정 값을 0으로 그리거나 양옆의 확정 구간과 연결하지 않는다.
  const paths = (values: (number | null)[]) => {
    const segments: { points: string; start: number; end: number }[] = [];
    values.forEach((value, index) => {
      if (value === null) return;
      const point = `${x(index)},${y(value)}`;
      const last = segments.at(-1);
      if (last && last.end === index - 1) {
        last.points += ' ' + point;
        last.end = index;
      } else segments.push({ points: point, start: index, end: index });
    });
    return segments;
  };
  const valueLabel = (value: number | null | undefined) =>
    value == null ? '미확정' : formatNumber(value) + unit;
  const handlePointerMove = (event: PointerEvent<SVGSVGElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    // 화면 좌표를 SVG 좌표로 변환해 마우스에 가장 가까운 구간을 선택한다.
    const position = ((event.clientX - bounds.left) / bounds.width) * width;
    setPointerY(event.clientY - bounds.top);
    setActiveIndex(
      getNearestChartIndex(position, firstX, pointWidth, labels.length),
    );
  };
  const showLabel = (index: number) =>
    index === 0 ||
    index === labels.length - 1 ||
    (index % tickInterval === 0 &&
      index < labels.length - 1 - tickInterval / 2);
  const getLabelAnchor = (index: number) => {
    if (labels.length === 1) return 'middle';
    if (index === 0) return 'start';
    if (index === labels.length - 1) return 'end';
    return 'middle';
  };
  const hidePointer = () => {
    setActiveIndex(null);
    setPointerY(null);
  };
  const tooltipVisible = activeIndex !== null;
  // 툴팁은 활성 구간 옆에 붙이되 차트 오른쪽 절반에서는 왼쪽으로 뒤집어 잘리지 않게 한다.
  const tooltipFlipped = x(active) > width / 2;
  const tooltipTop = Math.min(
    bottom,
    Math.max(chartLayout.top, pointerY ?? y(primary.values[active] ?? 0)),
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
      <div ref={chartRef} className="relative rounded-lg bg-bg-surface">
        <svg
          aria-label={title}
          className="w-full text-caption-web"
          style={{
            height,
          }}
          viewBox={`0 0 ${width} ${height}`}
          onPointerMove={handlePointerMove}
          onPointerLeave={hidePointer}
        >
          <defs>
            <clipPath id={`${id}-plot`}>
              <rect
                x={chartLayout.left}
                y={chartLayout.top}
                width={plotWidth}
                height={bottom - chartLayout.top}
              />
            </clipPath>
            <linearGradient id={`${id}-bar`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--semantic-action-primary)" />
              <stop
                offset="100%"
                stopColor="var(--semantic-action-primary)"
                stopOpacity="0.35"
              />
            </linearGradient>
            <linearGradient id={`${id}-fill`} x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0%"
                stopColor="var(--semantic-action-primary)"
                stopOpacity="0.14"
              />
              <stop
                offset="100%"
                stopColor="var(--semantic-action-primary)"
                stopOpacity="0"
              />
            </linearGradient>
          </defs>
          {[0, 0.25, 0.5, 0.75, 1].map((fraction) => (
            <g key={fraction}>
              <line
                x1={chartLayout.left}
                x2={width - chartLayout.right}
                y1={y(min + (max - min) * fraction)}
                y2={y(min + (max - min) * fraction)}
                stroke="var(--semantic-border-subtle)"
                strokeDasharray={fraction === 0 ? undefined : '2 6'}
                strokeOpacity={fraction === 0 ? 1 : 0.6}
              />
              <text
                x={chartLayout.left - 8}
                y={y(min + (max - min) * fraction) + 4}
                textAnchor="end"
                fill="var(--semantic-text-tertiary)"
              >
                {axisFormatter.format(min + (max - min) * fraction)}
              </text>
            </g>
          ))}
          {/* 데이터 도형만 자르고 축 라벨·포커스 영역은 그대로 유지한다. */}
          <g clipPath={`url(#${id}-plot)`}>
            {variant === 'bar' &&
              primary.values.map((value, index) =>
                value === null ? null : (
                  <rect
                    key={labels[index]}
                    x={x(index) - barWidth / 2}
                    y={Math.min(y(value), y(0))}
                    width={barWidth}
                    height={Math.abs(y(value) - y(0))}
                    rx={3}
                    fill={`url(#${id}-bar)`}
                    fillOpacity={
                      activeIndex === null || activeIndex === index ? 1 : 0.45
                    }
                  />
                ),
              )}
            {variant === 'line' &&
              paths(primary.values).map((segment) => (
                <polygon
                  key={segment.start}
                  points={`${x(segment.start)},${y(0)} ${segment.points} ${x(segment.end)},${y(0)}`}
                  fill={`url(#${id}-fill)`}
                />
              ))}
            {[primary, ...(secondary ? [secondary] : [])].map((series, index) =>
              (variant === 'bar' && index === 0
                ? []
                : paths(series.values)
              ).map((segment) => (
                <polyline
                  key={series.name + segment.start}
                  points={segment.points}
                  fill="none"
                  stroke={
                    index === 0
                      ? 'var(--semantic-action-primary)'
                      : 'var(--semantic-action-secondary)'
                  }
                  strokeWidth={index === 0 ? 2.5 : 2}
                  strokeDasharray={index === 0 ? undefined : '5 5'}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              )),
            )}
          </g>
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
          {/* 점을 모두 그리는 대신 투명한 포커스 영역으로 구간별 키보드 탐색을 유지한다. */}
          {labels.map((label, index) => (
            <g key={label}>
              <circle
                role="img"
                aria-label={`${label}, ${primary.name} ${valueLabel(primary.values[index])}${secondary ? `, ${secondary.name} ${valueLabel(secondary.values[index])}` : ''}${tooltipDetails.map((detail) => `, ${detail.name} ${valueLabel(detail.values[index])}`).join('')}`}
                tabIndex={0}
                cx={x(index)}
                cy={y(primary.values[index] ?? 0)}
                r="10"
                fill="transparent"
                className="focus:outline-action-primary"
                onFocus={() => {
                  setPointerY(null);
                  setActiveIndex(index);
                }}
                onBlur={hidePointer}
                onMouseEnter={() => setActiveIndex(index)}
              />
              {showLabel(index) && (
                <text
                  x={x(index)}
                  y={labelY}
                  textAnchor={getLabelAnchor(index)}
                  fill="var(--semantic-text-secondary)"
                >
                  {label.slice(5) || label}
                </text>
              )}
            </g>
          ))}
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
          <span className="inline-flex items-center gap-1.5">
            <span
              aria-hidden
              className="w-4 border-t-2 border-dashed border-action-secondary"
            />
            {secondary.name}
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
