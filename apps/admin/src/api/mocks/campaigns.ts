import type {
  Campaign,
  CampaignReport,
  CampaignStatus,
} from '@admin/features/campaign/campaignTypes';

export const campaigns: Campaign[] = Array.from({ length: 28 }, (_, index) => {
  const number = 28 - index;
  const status: CampaignStatus = (
    ['ACTIVE', 'PAUSED', 'SCHEDULED', 'ENDED'] as const
  )[index % 4];
  const cumulativeSpent = status === 'SCHEDULED' ? 0 : 18000 + index * 1700;
  const validImpressions = cumulativeSpent / 10;

  return {
    ownerId: `OWN-${String((index % 24) + 1).padStart(4, '0')}`,
    registeredAt: `2026-09-${String(number).padStart(2, '0')} 09:00`,
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

// 실제 연동 시 캠페인 목록과 별도로 조회할 분석 리포트의 목업이다.
export const getMockCampaignReports = (): CampaignReport[] => {
  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
  const yesterday = new Date(`${today}T00:00:00Z`);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const confirmedThrough = yesterday.toISOString().slice(0, 10);

  return campaigns.map((campaign) => {
    const spentPoints = Math.max(
      0,
      campaign.cumulativeSpent - campaign.todaySpent,
    );
    return {
      campaignId: campaign.id,
      confirmedThrough,
      spentPoints,
      validImpressions: spentPoints / 10,
    };
  });
};
