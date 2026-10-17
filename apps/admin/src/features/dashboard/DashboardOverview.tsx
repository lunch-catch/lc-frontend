import { Link } from 'react-router';
import { formatNumber } from '@repo/utils';
import { ExternalLink } from 'lucide-react';

import { DashboardMetricCard } from './DashboardMetricCard';
import type {
  DashboardDailyAggregate,
  DashboardSummary,
} from './dashboardTypes';

interface DashboardOverviewProps {
  summary: DashboardSummary;
  previous: DashboardSummary;
  snapshot?: DashboardDailyAggregate;
  previousSnapshot?: DashboardDailyAggregate;
  canCompare: boolean;
  mismatchLink: string;
}

export const DashboardOverview = ({
  summary,
  previous,
  snapshot,
  previousSnapshot,
  canCompare,
  mismatchLink,
}: DashboardOverviewProps) => {
  const metrics = [
    {
      label: '누적 사용자',
      value: snapshot?.totalUsers ?? 0,
      previous: previousSnapshot?.totalUsers,
      unit: '명',
      description: `신규 ${formatNumber(summary.newUsers)}명 · 누적 탈퇴 ${formatNumber(snapshot?.withdrawnUsers ?? 0)}명 · 정지 ${formatNumber(snapshot?.suspendedUsers ?? 0)}명`,
    },
    {
      label: '일평균 활성 사용자',
      value: summary.activeUsers,
      previous: canCompare ? previous.activeUsers : undefined,
      unit: '명',
      description: '이벤트 발생 사용자 기준',
    },
    {
      label: '누적 입점 업체',
      value: snapshot?.totalStores ?? 0,
      previous: previousSnapshot?.totalStores,
      unit: '개',
      description: `신규 ${formatNumber(summary.newStores)}개`,
    },
    {
      label: '활성 캠페인',
      value: snapshot?.activeCampaigns ?? 0,
      previous: previousSnapshot?.activeCampaigns,
      unit: '개',
      description: '마지막 집계일 기준',
    },
    {
      label: '충전액',
      value: summary.charge,
      previous: canCompare ? previous.charge : undefined,
      unit: '원',
      description: '선택 기간 합계',
    },
    {
      label: '소진액',
      value: summary.spend,
      previous: canCompare ? previous.spend : undefined,
      unit: 'P',
      description: '과오 차감 정정 반영',
    },
    {
      label: '미소진 잔액',
      value: snapshot?.unspent ?? 0,
      previous: previousSnapshot?.unspent,
      unit: 'P',
      description: '예약 중 포인트 포함',
    },
  ];

  return (
    <section
      aria-label="핵심 지표"
      className="grid grid-cols-2 gap-3 xl:grid-cols-4"
    >
      {metrics.map((item) => (
        <DashboardMetricCard key={item.label} {...item} />
      ))}
      <Link
        to={mismatchLink}
        aria-label="정산 불일치 상세 보기"
        className={`group block rounded-xl focus-visible:outline-2 focus-visible:outline-action-primary [&>div]:h-full ${summary.mismatchCount ? '[&>div]:border-status-warning-border [&>div]:bg-status-warning-bg' : ''}`}
      >
        <DashboardMetricCard
          label={
            <span className="inline-flex items-center gap-1 transition-colors group-hover:text-text-brand group-focus-visible:text-text-brand">
              정산 불일치
              <ExternalLink aria-hidden className="size-3.5 shrink-0" />
            </span>
          }
          value={summary.mismatchCount}
          description={
            summary.mismatchCount
              ? '확인 필요 · 상세 보기'
              : '선택 기간 불일치 없음'
          }
        />
      </Link>
    </section>
  );
};
