import { Link } from 'react-router';
import { formatDate, formatNumber } from '@repo/utils';
import { ExternalLink } from 'lucide-react';

import {
  getBucketEnd,
  sumAnalytics,
} from '@admin/features/analytics/analyticsUtils';

import { DashboardMetricCard } from './DashboardMetricCard';
import type { useDashboardMetrics } from './useDashboardMetrics';

interface DashboardOverviewProps {
  metrics: ReturnType<typeof useDashboardMetrics>;
  mismatchLink: string;
}
const countLabel = (value: number | null | undefined, unit: string) =>
  value == null ? '—' : formatNumber(value) + unit;
export const DashboardOverview = ({
  metrics,
  mismatchLink,
}: DashboardOverviewProps) => {
  const {
    members,
    stores,
    sales,
    previousMembers,
    previousStores,
    previousSales,
    mismatches,
  } = metrics;
  const member = members.data?.items.at(-1);
  const store = stores.data?.items.at(-1);
  const sale = sales.data?.items.at(-1);
  const beforeMember = previousMembers.data?.items.at(-1);
  const beforeStore = previousStores.data?.items.at(-1);
  const beforeSale = previousSales.data?.items.at(-1);
  const basis = (
    data: typeof members.data | typeof stores.data | typeof sales.data,
  ) => {
    const last = data?.items.at(-1);
    return data && last
      ? formatDate(getBucketEnd(last.label, data.period, data.to)) + ' 기준'
      : '기간 말 기준';
  };
  const hint = (state: typeof members | typeof stores | typeof sales) =>
    state.loading
      ? '불러오는 중'
      : state.error
        ? '조회 실패'
        : state.data?.items.some((item) => item.status === 'IN_PROGRESS')
          ? '집계 중'
          : '데이터 없음';
  const cards = [
    {
      label: '누적 회원',
      basis: basis(members.data),
      value: member?.cumulativeMemberCount ?? null,
      previous: beforeMember?.cumulativeMemberCount,
      unit: '명',
      emptyLabel: hint(members),
      description:
        '기간 내 신규 ' +
        countLabel(sumAnalytics(members.data, 'newMemberCount'), '명') +
        ' · 누적 탈퇴 ' +
        countLabel(member?.withdrawnCount, '명') +
        ' · 정지 ' +
        countLabel(member?.suspendedCount, '명'),
    },
    // 서버가 구간별로 반올림한 일평균을 다시 평균 내지 않고 마지막 구간의 값을 표시한다.
    {
      label: '일평균 활성 회원',
      basis: member ? member.label + ' 구간' : '마지막 구간',
      value: member?.avgDailyActiveMembers ?? null,
      previous: beforeMember?.avgDailyActiveMembers,
      unit: '명',
      emptyLabel: hint(members),
      description: '이벤트 발생 회원 · 마지막 구간 일평균',
    },
    {
      label: '누적 입점 업체',
      basis: basis(stores.data),
      value: store?.cumulativeStoreCount ?? null,
      previous: beforeStore?.cumulativeStoreCount,
      unit: '개',
      emptyLabel: hint(stores),
      description:
        '최종 등록 가게 기준 · 신규 ' +
        countLabel(sumAnalytics(stores.data, 'newStoreCount'), '개'),
    },
    {
      label: '활성 캠페인',
      basis: basis(stores.data),
      value: store?.activeCampaignCount ?? null,
      previous: beforeStore?.activeCampaignCount,
      unit: '개',
      emptyLabel: hint(stores),
      description: '집행 중 캠페인',
    },
    {
      label: '충전액',
      basis: '선택 기간 합계',
      value: sumAnalytics(sales.data, 'chargeAmount'),
      previous: sumAnalytics(previousSales.data, 'chargeAmount'),
      unit: '원',
      emptyLabel: hint(sales),
    },
    {
      label: '소진액',
      basis: '선택 기간 합계',
      value: sumAnalytics(sales.data, 'spentAmount'),
      previous: sumAnalytics(previousSales.data, 'spentAmount'),
      unit: 'P',
      emptyLabel: hint(sales),
      description: '과오 차감 정정 반영',
    },
    {
      label: '미소진 잔액',
      basis: basis(sales.data),
      value: sale?.unspentBalance ?? null,
      previous: beforeSale?.unspentBalance,
      unit: 'P',
      emptyLabel: hint(sales),
      description: '예약 중 포인트 포함',
    },
  ];
  return (
    <section
      aria-label="핵심 지표"
      className="grid grid-cols-2 gap-3 xl:grid-cols-4"
    >
      {cards.map((card) => (
        <DashboardMetricCard key={card.label} {...card} />
      ))}
      <Link
        to={mismatchLink}
        aria-label="정산 불일치 상세 보기"
        className="group block rounded-xl focus-visible:outline-2 focus-visible:outline-action-primary [&>div]:h-full"
      >
        <DashboardMetricCard
          label={
            <span className="inline-flex items-center gap-1 group-hover:text-text-brand">
              정산 불일치
              <ExternalLink aria-hidden className="size-3.5" />
            </span>
          }
          value={mismatches.data ?? null}
          basis="집계 대상 기간 조회 건수"
          emptyLabel={
            mismatches.loading
              ? '불러오는 중'
              : mismatches.error
                ? '조회 실패'
                : '조회 기간 없음'
          }
          description={
            mismatches.data === undefined
              ? undefined
              : mismatches.data
                ? '확인 필요 · 상세 보기'
                : '선택 기간 불일치 없음'
          }
        />
      </Link>
    </section>
  );
};
