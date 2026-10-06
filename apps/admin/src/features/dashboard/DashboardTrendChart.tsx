import { useId, useState } from 'react';
import { formatNumber } from '@repo/utils';

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
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const active = Math.min(activeIndex ?? labels.length - 1, labels.length - 1);
  const width = Math.max(640, labels.length * 48);
  const height = 240;
  const max = Math.max(1, ...primary.values, ...(secondary?.values ?? []));
  const x = (index: number) =>
    64 + (index * (width - 96)) / Math.max(1, labels.length - 1);
  const y = (value: number) => 192 - (value / max) * 160;
  const path = (values: number[]) =>
    values.map((value, index) => `${x(index)},${y(value)}`).join(' ');
  if (!labels.length)
    return (
      <p className="py-10 text-center text-body-sm-web text-text-secondary">
        집계 완료된 데이터가 없습니다.
      </p>
    );
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3 text-caption-web">
        <div className="flex flex-wrap gap-4">
          <span className="text-text-brand">● {primary.name}</span>
          {secondary && (
            <span className="text-text-secondary">┄ {secondary.name}</span>
          )}
        </div>
        <p id={id} className="text-text-secondary">
          {labels[active]} · {primary.name}{' '}
          <strong className="text-text-primary">
            {formatNumber(primary.values[active])}
            {unit}
          </strong>
          {secondary && (
            <>
              {' '}
              · {secondary.name}{' '}
              <strong className="text-text-primary">
                {formatNumber(secondary.values[active] ?? 0)}
                {unit}
              </strong>
            </>
          )}
        </p>
      </div>
      <div className="overflow-x-auto rounded-lg bg-bg-page p-3">
        <svg
          aria-label={title}
          className="w-full text-caption-web"
          style={{
            minWidth: `calc(var(--space-12) * ${Math.max(13, labels.length)})`,
            height: 'calc(var(--space-16) * 4)',
          }}
          viewBox={`0 0 ${width} ${height}`}
        >
          {[0, 0.5, 1].map((fraction) => (
            <g key={fraction}>
              <line
                x1="64"
                x2={width - 32}
                y1={y(max * fraction)}
                y2={y(max * fraction)}
                stroke="var(--semantic-border-subtle)"
              />
              <text
                x="56"
                y={y(max * fraction) + 4}
                textAnchor="end"
                fill="var(--semantic-text-secondary)"
              >
                {new Intl.NumberFormat('ko-KR', { notation: 'compact' }).format(
                  max * fraction,
                )}
              </text>
            </g>
          ))}
          {secondary && (
            <polyline
              points={path(secondary.values)}
              fill="none"
              stroke="var(--semantic-text-tertiary)"
              strokeWidth="2"
              strokeDasharray="6 4"
            />
          )}
          <polyline
            points={path(primary.values)}
            fill="none"
            stroke="var(--semantic-action-primary)"
            strokeWidth="2"
          />
          {labels.map((label, index) => (
            <g key={label}>
              <circle
                role="img"
                aria-label={`${label}, ${primary.name} ${formatNumber(primary.values[index])}${unit}${secondary ? `, ${secondary.name} ${formatNumber(secondary.values[index] ?? 0)}${unit}` : ''}`}
                aria-describedby={id}
                tabIndex={0}
                cx={x(index)}
                cy={y(primary.values[index])}
                r={active === index ? 6 : 4}
                fill="var(--semantic-action-primary)"
                className="focus:outline-action-primary"
                onFocus={() => setActiveIndex(index)}
                onMouseEnter={() => setActiveIndex(index)}
              >
                <title>
                  {label}: {formatNumber(primary.values[index])}
                  {unit}
                </title>
              </circle>
              {(index % Math.max(1, Math.ceil(labels.length / 10)) === 0 ||
                index === labels.length - 1) && (
                <text
                  x={x(index)}
                  y="224"
                  textAnchor="middle"
                  fill="var(--semantic-text-secondary)"
                >
                  {label.slice(5) || label}
                </text>
              )}
            </g>
          ))}
        </svg>
      </div>
      <p className="text-caption-web text-text-secondary">
        그래프의 점에 마우스를 올리거나 키보드로 이동하면 정확한 수치를 확인할
        수 있습니다.
      </p>
    </div>
  );
};
