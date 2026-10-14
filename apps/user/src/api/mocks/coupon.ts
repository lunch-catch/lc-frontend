import { getNow } from '@user/api/clock';
import type {
  CampaignIssueStatus,
  Coupon,
  CouponState,
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

let lastCouponId = 1000;

// 쿠폰이 어느 캠페인에서 받은 것인지 mock 안에서만 기억한다 (실제 응답에는 캠페인 ID가 없다)
type MockCoupon = Coupon & { campaignId: string };

interface CreateCouponOptions {
  // 오늘 기준 며칠 전에 받았는지. 0이면 오늘
  dayOffset?: number;
  issueTime?: Date;
  state?: CouponState;
  usedTime?: string;
}

// 피드 카드의 할인을 쿠폰 명세 모양으로 바꾼다
// "전 메뉴"로 시작하는 카드는 전 메뉴 정액 할인, 나머지는 메뉴 정액 할인으로 둔다
const toDiscount = (card: FeedCard, storeIndex: number) => {
  const discount = card.originalPrice - card.salePrice;
  if (card.offerTitle.startsWith('전 메뉴')) {
    return {
      discountTargetType: 'ALL' as const,
      discountType: 'AMOUNT' as const,
      discountValue: discount,
      targetMenu: null,
    };
  }
  return {
    discountTargetType: 'MENU' as const,
    discountType: 'AMOUNT' as const,
    discountValue: discount,
    targetMenu: {
      menuId: 700 + storeIndex,
      name: card.offerTitle,
      price: card.originalPrice,
      discountedPrice: card.salePrice,
    },
  };
};

const createCoupon = (
  card: FeedCard,
  {
    dayOffset = 0,
    issueTime = dateAt(dayOffset, card.issueOpenTime),
    state = 'ISSUED',
    usedTime,
  }: CreateCouponOptions = {},
): MockCoupon => {
  lastCouponId += 1;
  const storeIndex = mockFeedCards.indexOf(card);
  const discount = toDiscount(card, storeIndex);
  const discountAmount =
    discount.targetMenu === null
      ? discount.discountValue
      : discount.targetMenu.price - discount.targetMenu.discountedPrice;

  return {
    memberCouponId: lastCouponId,
    campaignId: card.campaignId,
    storeId: 10 + storeIndex,
    storeName: card.storeName,
    storeImageUrl: card.imageUrl,
    ...discount,
    state,
    usable: false,
    issueTime: issueTime.toISOString(),
    // 쿠폰은 받은 날 캠페인 사용 시간 안에만 쓸 수 있다
    usableStartTime: dateAt(dayOffset, card.usableFrom).toISOString(),
    usableEndTime: dateAt(dayOffset, card.usableTo).toISOString(),
    useTime: usedTime ? dateAt(dayOffset, usedTime).toISOString() : null,
    discountAmount: state === 'USED' ? discountAmount : null,
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
    state: 'USED',
    usedTime: '12:34',
  },
  { campaignId: 'campaign-8', dayOffset: -1, state: 'EXPIRED' },
  {
    campaignId: 'campaign-katsu',
    dayOffset: -3,
    state: 'USED',
    usedTime: '12:05',
  },
];

const coupons: MockCoupon[] = initialCoupons.flatMap(
  ({ campaignId, ...options }) => {
    const card = findCard(campaignId);
    return card ? [createCoupon(card, options)] : [];
  },
);

const findTodayCoupon = (campaignId: string) =>
  coupons.find(
    (coupon) => coupon.campaignId === campaignId && isToday(coupon.issueTime),
  );

// 서버처럼 조회 시점에 사용 시간이 지난 쿠폰은 만료로 바꾸고, 지금 쓸 수 있는지 계산한다
export const getMockCoupons = (now: number): Coupon[] =>
  coupons.map((mockCoupon) => {
    // mock 안에서만 쓰는 캠페인 ID는 응답에서 뺀다
    const coupon: Coupon & { campaignId?: string } = { ...mockCoupon };
    delete coupon.campaignId;

    const start = Date.parse(coupon.usableStartTime);
    const end = Date.parse(coupon.usableEndTime);
    const state =
      coupon.state === 'ISSUED' && now >= end ? 'EXPIRED' : coupon.state;
    return {
      ...coupon,
      state,
      usable: state === 'ISSUED' && now >= start && now < end,
    };
  });

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
  coupons.filter((coupon) => isToday(coupon.issueTime)).length;

export const issueMockCoupon = (campaignId: string): IssueResult => {
  const campaign = campaigns.get(campaignId);
  const card = findCard(campaignId);

  // 같은 캠페인은 하루 한 번만 받으므로, 이미 받았으면 수량을 다시 줄이지 않는다
  if (findTodayCoupon(campaignId)) return 'issued';
  if (!campaign || !card || campaign.remainingCount === 0) return 'soldOut';
  if (getMockIssuedCount() >= MOCK_DAILY_ISSUE_LIMIT) return 'limitReached';

  campaign.remainingCount -= 1;
  // 주소의 ?mockTime과 맞도록 앱 시계로 받은 시각을 남긴다
  coupons.unshift(createCoupon(card, { issueTime: new Date(getNow()) }));

  return 'issued';
};
