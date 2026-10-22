import type { PointerEvent } from 'react';
import { useId, useLayoutEffect, useRef, useState } from 'react';
import { formatNumber } from '@repo/utils';

import {
  getChartAxisMaximum,
  getChartLabelInterval,
  getNearestChartIndex,
} from './dashboardChartUtils';

const chartLayout = { left: 64, right: 32, top: 20 };
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
  unit?: string;
  height?: number;
}

export const DashboardTrendChart = ({
  title,
  labels,
  primary,
  secondary,
  unit = '건',
  height = 208,
}: DashboardTrendChartProps) => {
  // 아래쪽 48px은 x축 라벨 영역으로 남긴다.
  const bottom = height - 48;
  const labelY = height - 16;
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
  const x = (index: number) =>
    labels.length === 1
      ? chartLayout.left + plotWidth / 2
      : chartLayout.left + (index * plotWidth) / (labels.length - 1);
  const y = (value: number) =>
    bottom - ((value - min) / (max - min)) * (bottom - chartLayout.top);
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
      getNearestChartIndex(
        position,
        chartLayout.left,
        plotWidth,
        labels.length,
      ),
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
      <p className="py-10 text-center text-body-sm-web text-text-secondary">
        집계 완료된 데이터가 없습니다.
      </p>
    );
  return (
    <div className="space-y-2">
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
          {paths(primary.values).map((segment) => (
            <polygon
              key={segment.start}
              points={`${x(segment.start)},${y(0)} ${segment.points} ${x(segment.end)},${y(0)}`}
              fill={`url(#${id}-fill)`}
            />
          ))}
          {[primary, ...(secondary ? [secondary] : [])].map((series, index) =>
            paths(series.values).map((segment) => (
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
                aria-label={`${label}, ${primary.name} ${valueLabel(primary.values[index])}${secondary ? `, ${secondary.name} ${valueLabel(secondary.values[index])}` : ''}`}
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
            className="pointer-events-none absolute z-10 w-max rounded-lg whitespace-nowrap border border-border-subtle bg-bg-surface px-3 py-2 shadow-md"
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
            </div>
          </div>
        )}
      </div>
      <div className="sr-only">
        <span>마우스 또는 키보드로 구간별 수치를 확인하세요.</span>
        <span>단위: {unit}</span>
      </div>
    </div>
  );
};
