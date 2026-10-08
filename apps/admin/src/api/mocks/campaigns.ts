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
    startDate: status === 'SCHEDULED' ? '2026-10-05' : '2026-09-20',
    endDate: status === 'ENDED' ? '2026-09-30' : '2026-10-20',
    dailyBudget: 10000 + (index % 3) * 5000,
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

  return campaigns.map((campaign, index) => {
    const spentPoints =
      campaign.status === 'SCHEDULED'
        ? 0
        : 18000 +
          index * 1700 -
          (campaign.status === 'ACTIVE' ? 2400 + index * 100 : 0);
    return {
      campaignId: campaign.id,
      confirmedThrough,
      spentPoints,
      validImpressions: spentPoints / 10,
    };
  });
};
