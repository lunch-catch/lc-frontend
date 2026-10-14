import { request } from './client';
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

// 받은 쿠폰의 상태 (GET /v1/coupons 명세)
// ISSUED: 아직 안 씀(사용 시작 전 포함), USED: 사용 완료, EXPIRED: 사용 시간이 지남
export type CouponState = 'ISSUED' | 'USED' | 'EXPIRED';

// 메뉴 할인 쿠폰의 대상 메뉴. 받은 날의 가격으로 고정된다
export interface CouponTargetMenu {
  menuId: number;
  name: string;
  price: number;
  discountedPrice: number;
}

// 받은 쿠폰 한 장 (GET /v1/coupons, GET /v1/coupons/{memberCouponId})
// 가게와 혜택은 이벤트를 만들 때 고정한 값이라 원래 캠페인이 바뀌어도 그대로다
export interface Coupon {
  memberCouponId: number;
  storeId: number;
  storeName: string;
  storeImageUrl: string | null;
  // 지원하는 조합은 MENU+PERCENT, MENU+AMOUNT, ALL+AMOUNT (ALL+PERCENT는 없음)
  discountTargetType: 'ALL' | 'MENU';
  discountType: 'PERCENT' | 'AMOUNT';
  // PERCENT면 할인율(%), AMOUNT면 할인액(원)
  discountValue: number;
  // MENU면 있고 ALL이면 null
  targetMenu: CouponTargetMenu | null;
  state: CouponState;
  // ISSUED이고 지금이 사용 시간 안이면 true
  usable: boolean;
  issueTime: string;
  // 시작은 포함, 종료는 제외
  usableStartTime: string;
  usableEndTime: string;
  // 사용 완료 쿠폰에만 있다
  useTime: string | null;
  discountAmount: number | null;
}

// 쿠폰 목록 필터. 명세의 filter 표현식과 짝을 이룬다
export type CouponFilter = 'issued' | 'used' | 'expired';

const couponFilterStates: Record<CouponFilter, CouponState> = {
  issued: 'ISSUED',
  used: 'USED',
  expired: 'EXPIRED',
};

// 발급 API(POST /v1/coupons)가 아직 없어 실제 서버에는 받은 쿠폰이 쌓이지 않는다
// 그동안은 mock으로 화면을 만들고, 발급 API가 나오면 true로 바꿔 쿠폰 API를 함께 쓴다
const USE_COUPON_API = false;

const MOCK_DELAY_MS = 600;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// 오늘 받은 쿠폰 수와 하루 한도 (GET /v1/coupons/issuance-limit)
export interface IssuanceLimit {
  date: string;
  issuedCount: number;
  dailyLimit: number;
  dailyLimitReached: boolean;
}

export const fetchIssuanceLimit = () =>
  request<IssuanceLimit>('/v1/coupons/issuance-limit');

// 찜 목록에서 받은 캠페인 ID를 보내 각 캠페인의 발급 상태를 한 번에 받는다
// 캠페인별 상태(:getStatus)는 아직 서버에 없어 mock이고, 하루 한도만 쿠폰 API를 쓸 수 있다
// 주소에 ?mockDailyLimit를 붙이면 하루 한도에 닿은 상태를 확인할 수 있다
export const fetchIssueStatus = async (
  campaignIds: string[],
): Promise<IssueStatusResponse> => {
  const campaigns = campaignIds
    .map(getMockIssueStatus)
    .filter((status) => status !== undefined);

  if (USE_COUPON_API) {
    const limit = await fetchIssuanceLimit();
    return {
      campaigns,
      dailyLimit: limit.dailyLimit,
      dailyRemaining: Math.max(0, limit.dailyLimit - limit.issuedCount),
    };
  }

  await wait(MOCK_DELAY_MS);

  const issuedCount = new URLSearchParams(window.location.search).has(
    'mockDailyLimit',
  )
    ? MOCK_DAILY_ISSUE_LIMIT
    : getMockIssuedCount();

  return {
    campaigns,
    dailyLimit: MOCK_DAILY_ISSUE_LIMIT,
    dailyRemaining: MOCK_DAILY_ISSUE_LIMIT - issuedCount,
  };
};

interface CouponPage {
  items: Coupon[];
  nextPageToken: string | null;
}

// 쿠폰 목록을 마지막 페이지까지 이어서 받는다. 하루 3장이라 페이지가 많지 않다
const fetchAllCouponPages = async (filter?: CouponFilter) => {
  const items: Coupon[] = [];
  let pageToken: string | null = null;

  do {
    const params = new URLSearchParams({ pageSize: '100' });
    if (filter) params.set('filter', `state = "${couponFilterStates[filter]}"`);
    if (pageToken) params.set('pageToken', pageToken);

    const page: CouponPage = await request<CouponPage>(
      `/v1/coupons?${params.toString()}`,
    );
    items.push(...page.items);
    pageToken = page.nextPageToken;
  } while (pageToken);

  return items;
};

// 받은 쿠폰을 최근에 받은 순서로 받는다. filter를 주면 그 상태만 받는다
// 주소에 ?mockCouponsEmpty를 붙이면 받은 쿠폰이 없는 상태를 확인할 수 있다
export const fetchCoupons = async (
  filter?: CouponFilter,
): Promise<Coupon[]> => {
  if (USE_COUPON_API) return fetchAllCouponPages(filter);

  await wait(MOCK_DELAY_MS);

  if (new URLSearchParams(window.location.search).has('mockCouponsEmpty')) {
    return [];
  }

  return getMockCoupons(getNow())
    .filter((coupon) => !filter || coupon.state === couponFilterStates[filter])
    .sort((a, b) => b.issueTime.localeCompare(a.issueTime));
};

// 마이페이지 쿠폰 요약 (GET /v1/coupons/summary). 지금까지 쌓인 누적 값이다
export interface CouponSummary {
  receivedCouponCount: number;
  usedCouponCount: number;
  // 사용할 때 확정한 할인액의 합계(원)
  totalDiscountAmount: number;
}

export const fetchCouponSummary = () =>
  request<CouponSummary>('/v1/coupons/summary');

// 매장에서 보여줄 1회용 QR 토큰
export interface QrToken {
  value: string;
  expiresAt: number;
}

export const QR_TOKEN_LIFETIME_MS = 60_000;

// 60초 동안만 쓸 수 있는 QR 토큰을 받는다
// 실제 QR 생성 API(:generateQr)는 아직 서버에 없다. 생기면 서버가 그려 준 QR 이미지(PNG)와 만료 시각을 받는다
export const fetchQrToken = async (
  memberCouponId: number,
): Promise<QrToken> => {
  await wait(MOCK_DELAY_MS);

  const issuedAt = getNow();
  return {
    value: `lunch-catch:${memberCouponId}:${issuedAt}`,
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
