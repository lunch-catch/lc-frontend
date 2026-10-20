import type { StatusBadgeVariant } from '@repo/ui';
import { formatDateRange, formatNumber, formatWon } from '@repo/utils';

import type { AdminCampaign, CampaignStatus } from '@admin/api/campaigns';
import { ApiError } from '@admin/api/client';

export const campaignStatusMeta: Record<
  CampaignStatus,
  { label: string; variant: StatusBadgeVariant }
> = {
  DRAFT: { label: '임시저장', variant: 'neutral' },
  SCHEDULED: { label: '집행 예정', variant: 'info' },
  ACTIVE: { label: '집행 중', variant: 'success' },
  PAUSED: { label: '일시 중단', variant: 'warning' },
  ENDED: { label: '종료', variant: 'danger' },
};
export const getCampaignError = (cause: unknown) =>
  cause instanceof ApiError
    ? cause.code === 'CAMPAIGN-012'
      ? '캠페인을 찾을 수 없습니다.'
      : cause.message
    : '캠페인을 불러오지 못했습니다. 연결 상태를 확인한 뒤 다시 시도해 주세요.';
export const getCampaignPeriod = (campaign: AdminCampaign) =>
  campaign.startDate && campaign.endDate
    ? formatDateRange(campaign.startDate, campaign.endDate)
    : '미설정';
export const getCampaignDiscount = (campaign: AdminCampaign) =>
  `${campaign.discountTargetType === 'ALL' ? '전체 메뉴' : '지정 메뉴'} ${campaign.discountType === 'PERCENT' ? `${formatNumber(campaign.discountValue)}%` : formatWon(campaign.discountValue)} 할인`;
