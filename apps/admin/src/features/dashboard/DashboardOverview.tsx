import { formatDate } from '@repo/utils';

import { sumAnalytics } from '@admin/api/analyticsUtils';

import { DashboardMetricCard } from './DashboardMetricCard';
import { getDashboardMetricHint } from './dashboardUtils';
import type { useDashboardMetrics } from './useDashboardMetrics';

interface DashboardOverviewProps {
  metrics: ReturnType<typeof useDashboardMetrics>;
}
export const DashboardOverview = ({ metrics }: DashboardOverviewProps) => {
  const { sales, previousSales } = metrics;
  // 증감률에 사용한 이전 조회 응답의 실제 기간을 안내한다.
  const previousSeries = previousSales.data;
  const comparisonLabel = previousSeries
    ? `${formatDate(previousSeries.from)} ~ ${formatDate(previousSeries.to)} 대비`
    : undefined;
  const cards = [
    {
      label: '소진액 · 광고 매출',
      value: sumAnalytics(sales.data, 'spentAmount'),
      trend: sales.data?.items.map((row) => row.spentAmount) ?? [],
      previous: sumAnalytics(previousSales.data, 'spentAmount'),
      unit: 'P',
      emptyLabel: getDashboardMetricHint(sales),
      loading: sales.loading,
      emphasis: true,
    },
    {
      label: '충전액',
      value: sumAnalytics(sales.data, 'chargeAmount'),
      trend: sales.data?.items.map((row) => row.chargeAmount) ?? [],
      previous: sumAnalytics(previousSales.data, 'chargeAmount'),
      unit: '원',
      emptyLabel: getDashboardMetricHint(sales),
      loading: sales.loading,
    },
    {
      label: '환불액',
      value: sumAnalytics(sales.data, 'refundAmount'),
      trend: sales.data?.items.map((row) => row.refundAmount) ?? [],
      previous: sumAnalytics(previousSales.data, 'refundAmount'),
      unit: '원',
      emptyLabel: getDashboardMetricHint(sales),
      loading: sales.loading,
    },
    {
      label: '조정액',
      value: sumAnalytics(sales.data, 'adjustAmount'),
      trend: sales.data?.items.map((row) => row.adjustAmount) ?? [],
      previous: sumAnalytics(previousSales.data, 'adjustAmount'),
      unit: 'P',
      emptyLabel: getDashboardMetricHint(sales),
      loading: sales.loading,
    },
  ];
  return (
    <section
      aria-label="점주 주요 지표"
      className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
    >
      {cards.map((card) => (
        <DashboardMetricCard
          key={card.label}
          {...card}
          comparisonLabel={comparisonLabel}
          size="compact"
        />
      ))}
    </section>
  );
};
