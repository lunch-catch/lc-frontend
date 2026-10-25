import { memo } from 'react';
import { formatNumber } from '@repo/utils';

import type { getDashboardChartGeometry } from './dashboardChartUtils';

const axisFormatter = new Intl.NumberFormat('ko-KR', { notation: 'compact' });
export interface TrendSeries {
  name: string;
  /** 범례에 호버하거나 포커스했을 때 안내할 비교 기간. */
  description?: string;
  values: (number | null)[];
}

interface DashboardChartPlotProps {
  geometry: ReturnType<typeof getDashboardChartGeometry>;
  title: string;
  labels: string[];
  primary: TrendSeries;
  secondary?: TrendSeries;
  tooltipDetails: TrendSeries[];
  unit: string;
  height: number;
  width: number;
  variant: 'line' | 'bar';
  id: string;
  onPointFocus: (index: number) => void;
  onPointBlur: () => void;
}

// 호버 좌표와 무관한 SVG 축·도형·키보드 탐색 영역은 데이터나 크기가 바뀔 때만 그린다.
const DashboardChartPlotContent = ({
  geometry,
  title,
  labels,
  primary,
  secondary,
  tooltipDetails,
  unit,
  height,
  width,
  variant,
  id,
  onPointFocus,
  onPointBlur,
}: DashboardChartPlotProps) => {
  const {
    bottom,
    labelY,
    chartLayout,
    plotWidth,
    x,
    y,
    barWidth,
    min,
    max,
    paths,
    showLabel,
    getLabelAnchor,
  } = geometry;
  const valueLabel = (value: number | null | undefined) =>
    value == null ? '미확정' : formatNumber(value) + unit;
  return (
    <svg
      aria-label={title}
      className="w-full text-caption-web"
      style={{
        height,
      }}
      viewBox={`0 0 ${width} ${height}`}
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
                fillOpacity="var(--chart-bar-opacity, 1)"
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
          (variant === 'bar' && index === 0 ? [] : paths(series.values)).map(
            (segment) => (
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
            ),
          ),
        )}
      </g>
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
            onFocus={() => onPointFocus(index)}
            onBlur={onPointBlur}
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
    </svg>
  );
};
export const DashboardChartPlot = memo(DashboardChartPlotContent);
