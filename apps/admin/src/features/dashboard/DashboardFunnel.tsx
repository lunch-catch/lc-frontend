import { Link } from 'react-router';
import { Toggle } from '@repo/ui';
import { formatNumber } from '@repo/utils';
import { ExternalLink } from 'lucide-react';

import { DashboardMetricCard } from './DashboardMetricCard';
import { DashboardSection } from './DashboardSection';
import { DashboardTrendChart } from './DashboardTrendChart';
import type {
  DashboardSummary,
  DashboardTrendPoint,
  FunnelMetric,
} from './dashboardTypes';
import { funnelMetrics } from './dashboardUtils';

interface DashboardFunnelProps {
  summary: DashboardSummary;
  trend: DashboardTrendPoint[];
  previousTrend: DashboardTrendPoint[];
  metric: FunnelMetric;
  onMetricChange: (metric: FunnelMetric) => void;
  compare: boolean;
  canCompare: boolean;
  onCompareChange: (value: boolean) => void;
  validRatio: number | null;
}

export const DashboardFunnel = ({
  summary,
  trend,
  previousTrend,
  metric,
  onMetricChange,
  compare,
  canCompare,
  onCompareChange,
  validRatio,
}: DashboardFunnelProps) => {
  const selectedMetric = funnelMetrics.find((item) => item.value === metric)!;
  const invalid = summary.totalImpressions - summary.impressions;

  return (
    <DashboardSection
      example
      title="이용 추이"
      action={
        <Toggle
          label="이전 기간 비교"
          checked={compare && canCompare}
          disabled={!canCompare}
          onChange={(event) => onCompareChange(event.target.checked)}
        />
      }
    >
      <div className="mb-4 grid gap-2 sm:grid-cols-3">
        {funnelMetrics.map((item) => (
          <DashboardMetricCard
            key={item.value}
            label={item.label}
            value={summary[item.value]}
            selected={metric === item.value}
            onSelect={() => onMetricChange(item.value)}
          />
        ))}
      </div>
      <DashboardTrendChart
        key={metric + trend.map((point) => point.label).join(',')}
        title={selectedMetric.label + ' 추이'}
        labels={trend.map((point) => point.label)}
        primary={{
          name: selectedMetric.label,
          values: trend.map((point) => point[metric]),
        }}
        secondary={
          compare && canCompare
            ? {
                name: '이전 기간',
                values: previousTrend.map((point) => point[metric]),
              }
            : undefined
        }
      />
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border-subtle pt-3 text-caption-web">
        <Link
          to="/fraud"
          aria-label="무효 노출 상세 보기"
          className="inline-flex items-center gap-1 rounded-md text-text-secondary hover:text-text-brand focus-visible:outline-2 focus-visible:outline-action-primary"
          title="과금 여부와 관계없이 유효한 노출을 합산합니다."
        >
          유효 노출 비율{' '}
          <strong className="font-semibold tabular-nums text-text-primary">
            {validRatio === null ? '—' : validRatio.toFixed(1) + '%'}
          </strong>
          <ExternalLink aria-hidden className="size-3.5 shrink-0" />
        </Link>
        <span className="tabular-nums text-text-secondary">
          무효 노출 {formatNumber(invalid)}건
        </span>
      </div>
    </DashboardSection>
  );
};
