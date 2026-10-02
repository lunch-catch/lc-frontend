import type { CampaignIssueStatus, IssueResult } from '@user/api/coupon';

import { mockFeedCards } from './feed';

// 하루에 받을 수 있는 쿠폰 수 (서버가 정해서 내려주는 값)
export const MOCK_DAILY_ISSUE_LIMIT = 3;

// 마감 카드를 바로 볼 수 있도록 미리 찜해 둔 캠페인 하나는 수량이 소진된 것으로 둔다
const SOLD_OUT_CAMPAIGN_ID = 'campaign-4';

// 캠페인별 잔여 수량과 사용 시간. 피드 mock 카드의 값을 그대로 쓴다
const campaigns = new Map(
  mockFeedCards.map((card) => [
    card.campaignId,
    {
      remainingCount:
        card.campaignId === SOLD_OUT_CAMPAIGN_ID ? 0 : card.remainingCount,
      usableFrom: card.usableFrom,
      usableTo: card.usableTo,
    },
  ]),
);

// 오늘 쿠폰을 받은 캠페인. mock 단계라 새로고침하면 비워진다
const issuedCampaignIds = new Set<string>();

export const getMockIssueStatus = (
  campaignId: string,
): CampaignIssueStatus | undefined => {
  const campaign = campaigns.get(campaignId);
  if (!campaign) return undefined;

  return {
    campaignId,
    ...campaign,
    isIssued: issuedCampaignIds.has(campaignId),
  };
};

export const getMockIssuedCount = () => issuedCampaignIds.size;

export const issueMockCoupon = (campaignId: string): IssueResult => {
  const campaign = campaigns.get(campaignId);

  // 같은 캠페인은 하루 한 번만 받으므로, 이미 받았으면 수량을 다시 줄이지 않는다
  if (issuedCampaignIds.has(campaignId)) return 'issued';
  if (!campaign || campaign.remainingCount === 0) return 'soldOut';
  if (issuedCampaignIds.size >= MOCK_DAILY_ISSUE_LIMIT) return 'limitReached';

  campaign.remainingCount -= 1;
  issuedCampaignIds.add(campaignId);

  return 'issued';
};
