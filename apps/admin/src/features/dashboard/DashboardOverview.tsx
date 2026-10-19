import { formatDate, formatNumber } from '@repo/utils';

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
  const {
    members,
    previousMembers,
    stores,
    previousStores,
    sales,
    previousSales,
  } = metrics;
  const member = members.data?.items.at(-1);
  const cards =
    view === 'members'
      ? [
          // 대시보드는 일별 조회이므로 마지막 구간 값은 종료일 하루의 활성 회원 수다.
          {
            label: '종료일 활성 회원',
            scope: 'endDate' as const,
            value: member?.avgDailyActiveMembers ?? null,
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
            previous: sumAnalytics(previousSales.data, 'chargeAmount'),
            unit: '원',
            emptyLabel: getDashboardMetricHint(sales),
            loading: sales.loading,
          },
          {
            label: '활성 캠페인',
            scope: 'endDate' as const,
            value: stores.data?.items.at(-1)?.activeCampaignCount ?? null,
            previous: previousStores.data?.items.at(-1)?.activeCampaignCount,
            basis: getEndDateBasis(stores),
            unit: '개',
            emptyLabel: getDashboardMetricHint(stores),
            loading: stores.loading,
          },
        ];
  const periodCards = cards.filter((card) => card.scope === 'period');
  const endDateCards = cards.filter((card) => card.scope === 'endDate');
  return (
    <section
      aria-label={view === 'members' ? '사용자 주요 지표' : '점주 주요 지표'}
      className={`grid gap-4 ${view === 'owners' ? 'lg:grid-cols-3' : 'lg:grid-cols-2'}`}
    >
      <div className={`space-y-2 ${view === 'owners' ? 'lg:col-span-2' : ''}`}>
        <h3 className="text-caption-web font-medium text-text-secondary">
          선택 기간 합계
        </h3>
        <div
          className={`grid gap-3 ${view === 'owners' ? 'sm:grid-cols-2' : ''}`}
        >
          {periodCards.map((card) => (
            <DashboardMetricCard key={card.label} {...card} size="compact" />
          ))}
        </div>
      </div>
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
    </section>
  );
};

export const DashboardSnapshots = ({
  metrics,
  view,
}: DashboardOverviewProps) => {
  const { members, stores, sales } = metrics;
  const member = members.data?.items.at(-1);
  // 누적·잔액은 여러 날을 합산하지 않고 종료일 스냅샷을 그대로 표시한다.
  const cards =
    view === 'members'
      ? [
          {
            label: '누적 회원',
            resource: members,
            value: member?.cumulativeMemberCount ?? null,
            unit: '명',
          },
          {
            label: '누적 탈퇴',
            resource: members,
            value: member?.withdrawnCount ?? null,
            unit: '명',
          },
          {
            label: '정지 회원',
            resource: members,
            value: member?.suspendedCount ?? null,
            unit: '명',
          },
        ]
      : [
          {
            label: '누적 입점 업체',
            resource: stores,
            value: stores.data?.items.at(-1)?.cumulativeStoreCount ?? null,
            unit: '개',
          },
          {
            label: '미소진 잔액',
            resource: sales,
            value: sales.data?.items.at(-1)?.unspentBalance ?? null,
            unit: 'P',
          },
        ];
  return (
    <section
      aria-label="누적·잔액 현황"
      className="space-y-3 border-t border-border-subtle pt-5"
    >
      <h3 className="text-body-sm-web font-medium text-text-secondary">
        누적·잔액 현황
      </h3>
      <p className="text-caption-web text-text-secondary">
        선택한 종료일의 현황이며, 기간 합계가 아닙니다.
      </p>
      <dl
        className={`grid rounded-lg border border-border-subtle sm:grid-cols-2 ${view === 'members' ? 'xl:grid-cols-3' : ''}`}
      >
        {cards.map(({ resource, ...card }) => (
          <div
            key={card.label}
            className="flex items-center justify-between gap-4 px-4 py-3"
          >
            <dt className="text-caption-web text-text-secondary">
              {card.label}
              <span className="mt-1 block text-text-tertiary">
                {getEndDateBasis(resource)}
              </span>
            </dt>
            <dd className="shrink-0 text-body-sm-web font-semibold tabular-nums text-text-secondary">
              {resource.loading
                ? '불러오는 중'
                : card.value === null
                  ? getDashboardMetricHint(resource)
                  : formatNumber(card.value) + card.unit}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
};
