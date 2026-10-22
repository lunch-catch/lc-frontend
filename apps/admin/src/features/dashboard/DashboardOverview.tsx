import { formatDate } from '@repo/utils';

import { sumAnalytics } from '@admin/api/analyticsUtils';

import { DashboardMetricCard } from './DashboardMetricCard';
import type { DashboardRange } from './dashboardTypes';
import { getDashboardMetricHint } from './dashboardUtils';
import type { useDashboardMetrics } from './useDashboardMetrics';

interface DashboardOverviewProps {
  metrics: ReturnType<typeof useDashboardMetrics>;
  view: 'members' | 'owners';
  range: DashboardRange;
}
export const DashboardOverview = ({
  metrics,
  view,
  range,
}: DashboardOverviewProps) => {
  const { members, previousMembers, sales, previousSales } = metrics;
  const member = members.data?.items.at(-1);
  const cards =
    view === 'members'
      ? [
          {
            label: `${formatDate(range.startDate)} ~ ${formatDate(range.endDate)} 기간 신규 회원`,
            value: sumAnalytics(members.data, 'newMemberCount'),
            previous: sumAnalytics(previousMembers.data, 'newMemberCount'),
            unit: '명',
            emptyLabel: getDashboardMetricHint(members),
            loading: members.loading,
          },
          // 대시보드는 일별 조회이므로 마지막 구간 값은 종료일 하루의 활성 회원 수다.
          {
            label: `${formatDate(range.endDate)}일 활성 회원`,
            value: member?.avgDailyActiveMembers ?? null,
            previous:
              previousMembers.data?.items.at(-1)?.avgDailyActiveMembers ?? null,
            unit: '명',
            emptyLabel: getDashboardMetricHint(members),
            loading: members.loading,
            emphasis: true,
          },
        ]
      : [
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
      aria-label={view === 'members' ? '사용자 주요 지표' : '점주 주요 지표'}
      className={`grid gap-3 sm:grid-cols-2 ${view === 'owners' ? 'xl:grid-cols-4' : ''}`}
    >
      {cards.map((card) => (
        <DashboardMetricCard key={card.label} {...card} size="compact" />
      ))}
    </section>
  );
};
