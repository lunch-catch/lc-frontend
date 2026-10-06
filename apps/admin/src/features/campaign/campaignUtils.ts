import type { StatusBadgeVariant } from '@repo/ui';

import type { Campaign, CampaignStatus } from './campaignTypes';

export const campaignStatusMeta: Record<
  CampaignStatus,
  { label: string; variant: StatusBadgeVariant }
> = {
  SCHEDULED: { label: '집행 예정', variant: 'info' },
  ACTIVE: { label: '집행 중', variant: 'success' },
  PAUSED: { label: '일시 중단', variant: 'warning' },
  ENDED: { label: '종료', variant: 'danger' },
};

export const getBudgetProgress = (campaign: Campaign) =>
  campaign.cumulativeTarget > 0
    ? (campaign.cumulativeSpent / campaign.cumulativeTarget) * 100
    : 0;
