import { formatDate } from '@repo/utils';

import {
  getBucketEnd,
  sumAnalytics,
} from '@admin/features/analytics/analyticsUtils';

import { DashboardMetricCard } from './DashboardMetricCard';
import type { useDashboardMetrics } from './useDashboardMetrics';

interface DashboardOverviewProps {
  metrics: ReturnType<typeof useDashboardMetrics>;
  view: 'members' | 'owners';
}
type MetricResource =
  | DashboardOverviewProps['metrics']['members']
  | DashboardOverviewProps['metrics']['stores']
  | DashboardOverviewProps['metrics']['sales'];

const basis = ({ data }: MetricResource) => {
  const last = data?.items.at(-1);
  return data && last
    ? formatDate(getBucketEnd(last.label, data.period, data.to)) + ' 기준'
    : '기간 말 기준';
};
const hint = (state: MetricResource) =>
  state.loading
    ? '불러오는 중'
    : state.error
      ? '조회 실패'
      : state.data?.items.some((item) => item.status === 'IN_PROGRESS')
        ? '집계 중'
        : '데이터 없음';

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
          {
            label: '신규 회원',
            value: sumAnalytics(members.data, 'newMemberCount'),
            previous: sumAnalytics(previousMembers.data, 'newMemberCount'),
            basis: '선택 기간 합계',
            unit: '명',
            emptyLabel: hint(members),
            emphasis: true,
          },
          // 구간별로 반올림한 서버의 일평균을 다시 평균 내지 않는다.
          {
            label: '일평균 활성 회원',
            value: member?.avgDailyActiveMembers ?? null,
            previous: previousMembers.data?.items.at(-1)?.avgDailyActiveMembers,
            basis: member ? member.label + ' 구간' : '마지막 구간',
            unit: '명',
            emptyLabel: hint(members),
            description: '그날 이벤트가 발생한 회원 · 마지막 구간 일평균',
          },
        ]
      : [
          {
            label: '소진액 · 광고 매출',
            value: sumAnalytics(sales.data, 'spentAmount'),
            previous: sumAnalytics(previousSales.data, 'spentAmount'),
            basis: '선택 기간 합계',
            unit: 'P',
            emptyLabel: hint(sales),
            emphasis: true,
          },
          {
            label: '충전액',
            value: sumAnalytics(sales.data, 'chargeAmount'),
            previous: sumAnalytics(previousSales.data, 'chargeAmount'),
            basis: '선택 기간 합계',
            unit: '원',
            emptyLabel: hint(sales),
          },
          {
            label: '활성 캠페인',
            value: stores.data?.items.at(-1)?.activeCampaignCount ?? null,
            previous: previousStores.data?.items.at(-1)?.activeCampaignCount,
            basis: basis(stores),
            unit: '개',
            emptyLabel: hint(stores),
          },
        ];
  return (
    <section
      aria-label={view === 'members' ? '사용자 주요 지표' : '점주 주요 지표'}
      className={`grid gap-3 sm:grid-cols-2 ${view === 'owners' ? 'xl:grid-cols-3' : ''}`}
    >
      {cards.map((card) => (
        <DashboardMetricCard key={card.label} {...card} />
      ))}
    </section>
  );
};

export const DashboardSnapshots = ({
  metrics,
  view,
}: DashboardOverviewProps) => {
  const { members, stores, sales } = metrics;
  const member = members.data?.items.at(-1);
  const cards =
    view === 'members'
      ? [
          {
            label: '누적 회원',
            value: member?.cumulativeMemberCount ?? null,
            unit: '명',
          },
          {
            label: '누적 탈퇴',
            value: member?.withdrawnCount ?? null,
            unit: '명',
          },
          {
            label: '정지 회원',
            value: member?.suspendedCount ?? null,
            unit: '명',
          },
        ]
      : [
          {
            label: '누적 입점 업체',
            value: stores.data?.items.at(-1)?.cumulativeStoreCount ?? null,
            unit: '개',
          },
          {
            label: '미소진 잔액',
            value: sales.data?.items.at(-1)?.unspentBalance ?? null,
            unit: 'P',
          },
        ];
  return (
    <section
      aria-label="기간 말 현황"
      className="space-y-3 border-t border-border-subtle pt-5"
    >
      <h3 className="text-body-sm-web font-medium text-text-secondary">
        기간 말 현황
      </h3>
      <div
        className={`grid gap-3 sm:grid-cols-2 ${view === 'members' ? 'xl:grid-cols-3' : ''}`}
      >
        {cards.map((card, index) => {
          const resource =
            view === 'members' ? members : index === 0 ? stores : sales;
          return (
            <DashboardMetricCard
              key={card.label}
              {...card}
              size="compact"
              basis={basis(resource)}
              emptyLabel={hint(resource)}
            />
          );
        })}
      </div>
    </section>
  );
};
