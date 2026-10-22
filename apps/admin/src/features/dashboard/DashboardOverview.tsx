import { formatDate } from '@repo/utils';

import { getBucketEnd, sumAnalytics } from '@admin/api/analyticsUtils';

import { DashboardMetricCard } from './DashboardMetricCard';
import { getDashboardMetricHint } from './dashboardUtils';
import type { useDashboardMetrics } from './useDashboardMetrics';

interface DashboardOverviewProps {
  metrics: ReturnType<typeof useDashboardMetrics>;
  view: 'members' | 'owners';
}
type MetricResource =
  | DashboardOverviewProps['metrics']['members']
  | DashboardOverviewProps['metrics']['stores']
  | DashboardOverviewProps['metrics']['sales'];

const getEndDateBasis = ({ data }: MetricResource) => {
  const last = data?.items.at(-1);
  return data && last
    ? formatDate(getBucketEnd(last.label, data.period, data.to)) + ' 기준'
    : '조회 종료일 기준';
};
export const DashboardOverview = ({
  metrics,
  view,
}: DashboardOverviewProps) => {
  const { members, previousMembers, sales, previousSales } = metrics;
  const member = members.data?.items.at(-1);
  const cards =
    view === 'members'
      ? [
          // 대시보드는 일별 조회이므로 마지막 구간 값은 종료일 하루의 활성 회원 수다.
          {
            label: '종료일 활성 회원',
            scope: 'endDate' as const,
            value: member?.avgDailyActiveMembers ?? null,
            trend: members.data?.items.map((row) => row.avgDailyActiveMembers),
            previous: previousMembers.data?.items.at(-1)?.avgDailyActiveMembers,
            basis: getEndDateBasis(members),
            unit: '명',
            emptyLabel: getDashboardMetricHint(members),
            loading: members.loading,
            emphasis: true,
          },
          {
            label: '신규 회원',
            scope: 'period' as const,
            value: sumAnalytics(members.data, 'newMemberCount'),
            trend: members.data?.items.map((row) => row.newMemberCount),
            previous: sumAnalytics(previousMembers.data, 'newMemberCount'),
            unit: '명',
            emptyLabel: getDashboardMetricHint(members),
            loading: members.loading,
          },
        ]
      : [
          {
            label: '소진액 · 광고 매출',
            scope: 'period' as const,
            value: sumAnalytics(sales.data, 'spentAmount'),
            trend: sales.data?.items.map((row) => row.spentAmount),
            previous: sumAnalytics(previousSales.data, 'spentAmount'),
            unit: 'P',
            emptyLabel: getDashboardMetricHint(sales),
            loading: sales.loading,
            emphasis: true,
          },
          {
            label: '충전액',
            scope: 'period' as const,
            value: sumAnalytics(sales.data, 'chargeAmount'),
            trend: sales.data?.items.map((row) => row.chargeAmount),
            previous: sumAnalytics(previousSales.data, 'chargeAmount'),
            unit: '원',
            emptyLabel: getDashboardMetricHint(sales),
            loading: sales.loading,
          },
          {
            label: '환불액',
            scope: 'period' as const,
            value: sumAnalytics(sales.data, 'refundAmount'),
            previous: sumAnalytics(previousSales.data, 'refundAmount'),
            trend: sales.data?.items.map((row) => row.refundAmount),
            unit: '원',
            emptyLabel: getDashboardMetricHint(sales),
            loading: sales.loading,
          },
          {
            label: '조정액',
            scope: 'period' as const,
            value: sumAnalytics(sales.data, 'adjustAmount'),
            previous: sumAnalytics(previousSales.data, 'adjustAmount'),
            trend: sales.data?.items.map((row) => row.adjustAmount),
            unit: 'P',
            emptyLabel: getDashboardMetricHint(sales),
            loading: sales.loading,
          },
        ];
  const periodCards = cards.filter((card) => card.scope === 'period');
  const endDateCards = cards.filter((card) => card.scope === 'endDate');
  return (
    <section
      aria-label={view === 'members' ? '사용자 주요 지표' : '점주 주요 지표'}
      className={`grid gap-4 ${endDateCards.length > 0 ? 'lg:grid-cols-2' : ''}`}
    >
      <div className="space-y-2">
        <h3 className="text-caption-web font-medium text-text-secondary">
          선택 기간 합계
        </h3>
        <div
          className={`grid gap-3 ${endDateCards.length > 0 ? '' : 'sm:grid-cols-2 xl:grid-cols-4'}`}
        >
          {periodCards.map((card) => (
            <DashboardMetricCard key={card.label} {...card} size="compact" />
          ))}
        </div>
      </div>
      {endDateCards.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-caption-web font-medium text-text-secondary">
            종료일 기준
          </h3>
          <div className="grid gap-3">
            {endDateCards.map((card) => (
              <DashboardMetricCard key={card.label} {...card} size="compact" />
            ))}
          </div>
        </div>
      )}
    </section>
  );
};
