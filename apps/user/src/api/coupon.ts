import { getNow } from './clock';
import {
  getMockCoupons,
  getMockIssuedCount,
  getMockIssueStatus,
  issueMockCoupon,
  MOCK_DAILY_ISSUE_LIMIT,
} from './mocks/coupon';

// 캠페인 하나의 발급 상태
export interface CampaignIssueStatus {
  campaignId: string;
  remainingCount: number;
  usableFrom: string;
  usableTo: string;
  // 오늘 이 캠페인 쿠폰을 이미 받았는지
  isIssued: boolean;
}

export interface IssueStatusResponse {
  campaigns: CampaignIssueStatus[];
  // 하루에 받을 수 있는 쿠폰 수와 오늘 남은 횟수
  dailyLimit: number;
  dailyRemaining: number;
}

// 받기 결과. 받는 사이 수량이 소진되거나 하루 한도에 닿으면 실패한다
export type IssueResult = 'issued' | 'soldOut' | 'limitReached';

export type CouponStatus = 'available' | 'used' | 'expired';

// 받은 쿠폰 한 장
export interface Coupon {
  issueId: string;
  campaignId: string;
  storeName: string;
  imageUrl: string;
  offerTitle: string;
  originalPrice: number;
  salePrice: number;
  // 캠페인별 사용 가능 시간 (11:30~15:00 안에서 점주가 정함)
  usableFrom: string;
  usableTo: string;
  issuedAt: string;
  // 받은 날 사용 시간이 끝나는 시각
  expiresAt: string;
  // 사용한 시각. 사용 완료 쿠폰에만 있다
  usedAt?: string;
  status: CouponStatus;
}

const MOCK_DELAY_MS = 600;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// 찜 목록에서 받은 캠페인 ID를 보내 각 캠페인의 발급 상태를 한 번에 받는다
// 주소에 ?mockDailyLimit를 붙이면 하루 한도에 닿은 상태를 확인할 수 있다
export const fetchIssueStatus = async (
  campaignIds: string[],
): Promise<IssueStatusResponse> => {
  await wait(MOCK_DELAY_MS);

  const issuedCount = new URLSearchParams(window.location.search).has(
    'mockDailyLimit',
  )
    ? MOCK_DAILY_ISSUE_LIMIT
    : getMockIssuedCount();

  return {
    campaigns: campaignIds
      .map(getMockIssueStatus)
      .filter((status) => status !== undefined),
    dailyLimit: MOCK_DAILY_ISSUE_LIMIT,
    dailyRemaining: MOCK_DAILY_ISSUE_LIMIT - issuedCount,
  };
};

// 받은 쿠폰을 최근에 받은 순서로 받는다. 상태별로 나누는 건 화면에서 한다
// 주소에 ?mockCouponsEmpty를 붙이면 받은 쿠폰이 없는 상태를 확인할 수 있다
export const fetchCoupons = async (): Promise<Coupon[]> => {
  await wait(MOCK_DELAY_MS);

  if (new URLSearchParams(window.location.search).has('mockCouponsEmpty')) {
    return [];
  }

  return getMockCoupons().sort((a, b) => b.issuedAt.localeCompare(a.issuedAt));
};

// 매장에서 보여줄 1회용 QR 토큰
export interface QrToken {
  value: string;
  expiresAt: number;
}

export const QR_TOKEN_LIFETIME_MS = 60_000;

// 60초 동안만 쓸 수 있는 QR 토큰을 받는다
// 실제 서버는 서명한 토큰(JWT)을 주고, 한 번 쓰면 다시 쓸 수 없게 막는다
export const fetchQrToken = async (issueId: string): Promise<QrToken> => {
  await wait(MOCK_DELAY_MS);

  const issuedAt = getNow();
  return {
    value: `lunch-catch:${issueId}:${issuedAt}`,
    expiresAt: issuedAt + QR_TOKEN_LIFETIME_MS,
  };
};

// 주소에 ?mockIssueSoldOut을 붙이면 받는 사이 수량이 소진된 경우를 확인할 수 있다
export const issueCoupon = async (campaignId: string): Promise<IssueResult> => {
  await wait(MOCK_DELAY_MS);

  if (new URLSearchParams(window.location.search).has('mockIssueSoldOut')) {
    return 'soldOut';
  }

  return issueMockCoupon(campaignId);
};
