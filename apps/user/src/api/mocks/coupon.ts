import type {
  CampaignIssueStatus,
  Coupon,
  CouponStatus,
  IssueResult,
} from '@user/api/coupon';
import type { FeedCard } from '@user/api/feed';

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

// 오늘을 기준으로 며칠 전(dayOffset) 그 시각을 만든다
const dateAt = (dayOffset: number, time: string) => {
  const [hours = 0, minutes = 0] = time.split(':').map(Number);
  const date = new Date();
  date.setDate(date.getDate() + dayOffset);
  date.setHours(hours, minutes, 0, 0);
  return date;
};

const isToday = (isoString: string) =>
  new Date(isoString).toDateString() === new Date().toDateString();

let lastIssueNumber = 0;

interface CreateCouponOptions {
  // 오늘 기준 며칠 전에 받았는지. 0이면 오늘
  dayOffset?: number;
  issuedAt?: Date;
  status?: CouponStatus;
  usedTime?: string;
}

const createCoupon = (
  card: FeedCard,
  {
    dayOffset = 0,
    issuedAt = dateAt(dayOffset, card.issueOpenTime),
    status = 'available',
    usedTime,
  }: CreateCouponOptions = {},
): Coupon => {
  lastIssueNumber += 1;

  return {
    issueId: `issue-${lastIssueNumber}`,
    campaignId: card.campaignId,
    storeName: card.storeName,
    imageUrl: card.imageUrl,
    offerTitle: card.offerTitle,
    originalPrice: card.originalPrice,
    salePrice: card.salePrice,
    usableFrom: card.usableFrom,
    usableTo: card.usableTo,
    issuedAt: issuedAt.toISOString(),
    // 쿠폰은 받은 날 캠페인 사용 시간이 끝나면 만료된다
    expiresAt: dateAt(dayOffset, card.usableTo).toISOString(),
    usedAt: usedTime ? dateAt(dayOffset, usedTime).toISOString() : undefined,
    status,
  };
};

const findCard = (campaignId: string) =>
  mockFeedCards.find((card) => card.campaignId === campaignId);

// 받은 쿠폰 목록. 쿠폰함을 바로 볼 수 있도록 오늘 받은 쿠폰 1장과 지난 사용 내역을 미리 넣어 둔다
const initialCoupons: (CreateCouponOptions & { campaignId: string })[] = [
  { campaignId: 'campaign-5' },
  {
    campaignId: 'campaign-6',
    dayOffset: -1,
    status: 'used',
    usedTime: '12:34',
  },
  { campaignId: 'campaign-8', dayOffset: -1, status: 'expired' },
  {
    campaignId: 'campaign-7',
    dayOffset: -3,
    status: 'used',
    usedTime: '12:05',
  },
];

const coupons: Coupon[] = initialCoupons.flatMap(
  ({ campaignId, ...options }) => {
    const card = findCard(campaignId);
    return card ? [createCoupon(card, options)] : [];
  },
);

const findTodayCoupon = (campaignId: string) =>
  coupons.find(
    (coupon) => coupon.campaignId === campaignId && isToday(coupon.issuedAt),
  );

export const getMockCoupons = () => coupons.map((coupon) => ({ ...coupon }));

export const getMockIssueStatus = (
  campaignId: string,
): CampaignIssueStatus | undefined => {
  const campaign = campaigns.get(campaignId);
  if (!campaign) return undefined;

  return {
    campaignId,
    ...campaign,
    isIssued: findTodayCoupon(campaignId) !== undefined,
  };
};

// 오늘 받은 쿠폰 수. 하루 한도는 받은 날 기준이다
export const getMockIssuedCount = () =>
  coupons.filter((coupon) => isToday(coupon.issuedAt)).length;

export const issueMockCoupon = (campaignId: string): IssueResult => {
  const campaign = campaigns.get(campaignId);
  const card = findCard(campaignId);

  // 같은 캠페인은 하루 한 번만 받으므로, 이미 받았으면 수량을 다시 줄이지 않는다
  if (findTodayCoupon(campaignId)) return 'issued';
  if (!campaign || !card || campaign.remainingCount === 0) return 'soldOut';
  if (getMockIssuedCount() >= MOCK_DAILY_ISSUE_LIMIT) return 'limitReached';

  campaign.remainingCount -= 1;
  coupons.unshift(createCoupon(card, { issuedAt: new Date() }));

  return 'issued';
};
