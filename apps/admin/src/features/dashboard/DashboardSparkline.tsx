import { useId } from 'react';

interface DashboardSparklineProps {
  values: (number | null)[];
  className?: string;
}

const sparklineLayout = { width: 100, height: 32, padding: 3 };

export const DashboardSparkline = ({
  values,
  className = 'h-8 w-24',
}: DashboardSparklineProps) => {
  const id = useId();
  const numbers = values.filter((value): value is number => value !== null);
  if (numbers.length < 2) return null;
  const { width, height, padding } = sparklineLayout;
  const max = Math.max(...numbers);
  const min = Math.min(0, ...numbers);
  const range = max - min || 1;
  const x = (index: number) => (index * width) / (values.length - 1);
  const y = (value: number) =>
    height - padding - ((value - min) / range) * (height - padding * 2);
  // 미확정 구간은 0으로 그리거나 양옆과 잇지 않고 선을 끊는다.
  const segments: string[] = [];
  let current: string[] = [];
  values.forEach((value, index) => {
    if (value === null) {
      if (current.length > 0) segments.push(current.join(' '));
      current = [];
      return;
    }
    current.push(`${x(index)},${y(value)}`);
  });
  if (current.length > 0) segments.push(current.join(' '));
  return (
    <svg
      aria-hidden
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className={`shrink-0 overflow-visible ${className}`}
    >
      {/* 시작 구간은 옅게, 최근 구간으로 갈수록 짙게 그려 흐름의 방향을 드러낸다. */}
      <defs>
        <linearGradient
          id={`${id}-stroke`}
          gradientUnits="userSpaceOnUse"
          x1="0"
          y1="0"
          x2={width}
          y2="0"
        >
          <stop offset="0%" stopColor="var(--primitive-secondary-200)" />
          <stop offset="100%" stopColor="var(--primitive-secondary-700)" />
        </linearGradient>
      </defs>
      {segments.map((points) => (
        <polyline
          key={points}
          points={points}
          fill="none"
          stroke={`url(#${id}-stroke)`}
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </svg>
  );
};
