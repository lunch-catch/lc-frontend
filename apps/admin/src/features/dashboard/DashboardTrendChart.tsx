import type { PointerEvent } from 'react';
import { useEffect, useId, useRef, useState } from 'react';
import { formatNumber } from '@repo/utils';

import {
  getChartAxisMaximum,
  getChartLabelInterval,
  getNearestChartIndex,
} from './dashboardChartUtils';

const chartLayout = {
  height: 240,
  left: 64,
  right: 32,
  top: 32,
  bottom: 192,
  labelY: 224,
};
const axisFormatter = new Intl.NumberFormat('ko-KR', { notation: 'compact' });

interface TrendSeries {
  name: string;
  values: number[];
}

interface DashboardTrendChartProps {
  title: string;
  labels: string[];
  primary: TrendSeries;
  secondary?: TrendSeries;
  unit?: string;
}

export const DashboardTrendChart = ({
  title,
  labels,
  primary,
  secondary,
  unit = '건',
}: DashboardTrendChartProps) => {
  const id = useId();
  const chartRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(640);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const hasLabels = labels.length > 0;
  useEffect(() => {
    const container = chartRef.current;
    if (!container) return;
    // 패널 너비에 맞춰 좌표계를 바꿔 좁은 화면에서도 축 글자가 축소되지 않게 한다.
    const observer = new ResizeObserver(([entry]) => {
      setWidth(Math.max(160, Math.round(entry.contentRect.width)));
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [hasLabels]);
  const active = Math.min(activeIndex ?? labels.length - 1, labels.length - 1);
  const tickInterval = getChartLabelInterval(labels.length, width);
  const max = getChartAxisMaximum([
    ...primary.values,
    ...(secondary?.values ?? []),
  ]);
  const plotWidth = width - chartLayout.left - chartLayout.right;
  const x = (index: number) =>
    labels.length === 1
      ? chartLayout.left + plotWidth / 2
      : chartLayout.left + (index * plotWidth) / (labels.length - 1);
  const y = (value: number) =>
    chartLayout.bottom - (value / max) * (chartLayout.bottom - chartLayout.top);
  const path = (values: number[]) =>
    values.map((value, index) => `${x(index)},${y(value)}`).join(' ');
  const handlePointerMove = (event: PointerEvent<SVGSVGElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    // 화면 좌표를 SVG 좌표로 변환해 마우스에 가장 가까운 구간을 선택한다.
    const position = ((event.clientX - bounds.left) / bounds.width) * width;
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
  if (!labels.length)
    return (
      <p className="py-10 text-center text-body-sm-web text-text-secondary">
        집계 완료된 데이터가 없습니다.
      </p>
    );
  return (
    <div className="space-y-4">
      <div
        id={id}
        className="flex flex-wrap items-center justify-between gap-4 rounded-lg bg-bg-page px-4 py-3"
      >
        <div className="space-y-1">
          <p className="text-caption-web text-text-secondary">선택 구간</p>
          <p className="text-body-sm-web font-medium tabular-nums text-text-primary">
            {labels[active]}
          </p>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-3">
          {[primary, ...(secondary ? [secondary] : [])].map((series, index) => (
            <div key={series.name} className="space-y-1">
              <p className="flex items-center gap-2 text-caption-web text-text-secondary">
                <span
                  aria-hidden="true"
                  className={
                    index === 0
                      ? 'h-1 w-4 rounded-full bg-action-primary'
                      : 'w-4 border-t-2 border-dashed border-action-secondary'
                  }
                />
                {series.name}
              </p>
              <p className="text-h2-web font-semibold tabular-nums text-text-primary">
                {formatNumber(series.values[active] ?? 0)}
                <span className="ml-1 text-caption-web font-normal text-text-secondary">
                  {unit}
                </span>
              </p>
            </div>
          ))}
        </div>
      </div>
      <div ref={chartRef} className="rounded-lg bg-bg-surface">
        <svg
          aria-label={title}
          className="w-full text-caption-web"
          style={{
            height: 'calc(var(--space-16) * 4)',
          }}
          viewBox={`0 0 ${width} ${chartLayout.height}`}
          onPointerMove={handlePointerMove}
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
                y1={y(max * fraction)}
                y2={y(max * fraction)}
                stroke="var(--semantic-border-subtle)"
                strokeDasharray={fraction === 0 ? undefined : '2 6'}
                strokeOpacity={fraction === 0 ? 1 : 0.6}
              />
              <text
                x={chartLayout.left - 8}
                y={y(max * fraction) + 4}
                textAnchor="end"
                fill="var(--semantic-text-tertiary)"
              >
                {axisFormatter.format(max * fraction)}
              </text>
            </g>
          ))}
          <polygon
            points={`${x(0)},${chartLayout.bottom} ${path(primary.values)} ${x(primary.values.length - 1)},${chartLayout.bottom}`}
            fill={`url(#${id}-fill)`}
          />
          {secondary && (
            <polyline
              points={path(secondary.values)}
              fill="none"
              stroke="var(--semantic-action-secondary)"
              strokeWidth="2"
              strokeDasharray="5 5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
          <polyline
            points={path(primary.values)}
            fill="none"
            stroke="var(--semantic-action-primary)"
            strokeWidth="2.5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          <line
            x1={x(active)}
            x2={x(active)}
            y1={chartLayout.top}
            y2={chartLayout.bottom}
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
                aria-label={`${label}, ${primary.name} ${formatNumber(primary.values[index])}${unit}${secondary ? `, ${secondary.name} ${formatNumber(secondary.values[index] ?? 0)}${unit}` : ''}`}
                aria-describedby={id}
                tabIndex={0}
                cx={x(index)}
                cy={y(primary.values[index])}
                r="10"
                fill="transparent"
                className="focus:outline-action-primary"
                onFocus={() => setActiveIndex(index)}
                onMouseEnter={() => setActiveIndex(index)}
              >
                <title>
                  {label}: {formatNumber(primary.values[index])}
                  {unit}
                </title>
              </circle>
              {showLabel(index) && (
                <text
                  x={x(index)}
                  y={chartLayout.labelY}
                  textAnchor={getLabelAnchor(index)}
                  fill="var(--semantic-text-secondary)"
                >
                  {label.slice(5) || label}
                </text>
              )}
            </g>
          ))}
          <g pointerEvents="none">
            <circle
              cx={x(active)}
              cy={y(primary.values[active])}
              r="12"
              fill="var(--semantic-action-primary)"
              fillOpacity="0.12"
            />
            <circle
              cx={x(active)}
              cy={y(primary.values[active])}
              r="5"
              fill="var(--semantic-bg-surface)"
              stroke="var(--semantic-action-primary)"
              strokeWidth="2.5"
            />
            {secondary && (
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
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 text-caption-web text-text-secondary">
        <span>마우스 또는 키보드로 구간별 수치를 확인하세요.</span>
        <span>단위: {unit}</span>
      </div>
    </div>
  );
};
