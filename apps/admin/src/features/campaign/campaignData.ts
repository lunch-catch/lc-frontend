import type { StatusBadgeVariant } from '@repo/ui';

export type CampaignStatus = 'SCHEDULED' | 'ACTIVE' | 'PAUSED' | 'ENDED';

export interface Campaign {
  id: string;
  storeName: string;
  status: CampaignStatus;
  pausedReason?: string;
  startDate: string;
  endDate: string;
  dailyBudget: number;
  todaySpent: number;
  cumulativeSpent: number;
  cumulativeTarget: number;
  validImpressions: number;
  invalidImpressions: number;
  allocationImpressions: number;
  relevanceImpressions: number;
  radius: number;
  gender: string;
  ageGroups: string;
  posterTitle: string;
  posterImageUrl?: string;
  posterDescription: string;
}

export const campaignStatusMeta: Record<
  CampaignStatus,
  { label: string; variant: StatusBadgeVariant }
> = {
  SCHEDULED: { label: '집행 예정', variant: 'info' },
  ACTIVE: { label: '집행 중', variant: 'success' },
  PAUSED: { label: '일시 중단', variant: 'warning' },
  ENDED: { label: '종료', variant: 'danger' },
};

// API 연동 전 상태별 표시와 여러 페이지 조회를 확인하기 위한 고정 목업 데이터다.
export const campaigns: Campaign[] = Array.from({ length: 28 }, (_, index) => {
  const number = 28 - index;
  const status: CampaignStatus = (
    ['ACTIVE', 'PAUSED', 'SCHEDULED', 'ENDED'] as const
  )[index % 4];
  const cumulativeSpent = status === 'SCHEDULED' ? 0 : 18000 + index * 1700;
  const validImpressions = cumulativeSpent / 10;

  return {
    id: `CMP-${String(number).padStart(4, '0')}`,
    storeName: [
      '한상차림',
      '오늘의 파스타',
      '도시락 연구소',
      '미소 카레',
      '정성 한끼',
    ][index % 5],
    status,
    pausedReason:
      status === 'PAUSED'
        ? ['포인트 잔액 부족', '점주 직접 중단', '점주 계정 정지'][index % 3]
        : undefined,
    startDate: status === 'SCHEDULED' ? '2026-10-05' : '2026-09-20',
    endDate: status === 'ENDED' ? '2026-09-30' : '2026-10-20',
    dailyBudget: 10000 + (index % 3) * 5000,
    todaySpent: status === 'ACTIVE' ? 2400 + index * 100 : 0,
    cumulativeSpent,
    cumulativeTarget: status === 'SCHEDULED' ? 0 : 30000 + index * 1500,
    validImpressions,
    invalidImpressions: status === 'SCHEDULED' ? 0 : 12 + index,
    allocationImpressions: Math.floor(validImpressions * 0.6),
    relevanceImpressions: validImpressions - Math.floor(validImpressions * 0.6),
    radius: [500, 1000, 1500][index % 3],
    gender: ['전체', '여', '남'][index % 3],
    ageGroups: ['전체', '20대 · 30대', '40대 · 50대 이상'][index % 3],
    posterTitle: [
      '든든한 점심 한 끼',
      '오늘 점심은 파스타',
      '직장인을 위한 점심 할인',
    ][index % 3],
    posterDescription:
      '점심 시간에 사용할 수 있는 런치캐치 할인 쿠폰 캠페인입니다.',
  };
});

export const getBudgetProgress = (campaign: Campaign) =>
  // 집행 전에는 누적 목표가 없으므로 0으로 처리하고, 초과 소진율은 그대로 표시한다.
  campaign.cumulativeTarget > 0
    ? (campaign.cumulativeSpent / campaign.cumulativeTarget) * 100
    : 0;

export const formatPoints = (value: number) =>
  `${value.toLocaleString('ko-KR')} P`;
