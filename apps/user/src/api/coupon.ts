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

// 받은 쿠폰 목록과 단건 조회(GET /v1/coupons, GET /v1/coupons/{memberCouponId})는 서버 구현이 끝나 실제 API를 쓴다
// 발급 API가 나오기 전까지 찜 목록에서 받은 mock 쿠폰은 쿠폰함에 보이지 않는다
const USE_COUPON_LIST_API = true;

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

// 오늘 받은 쿠폰 수와 하루 한도. 발급 API가 나오기 전에는 mock 값을 쓴다
// 주소에 ?mockDailyLimit를 붙이면 하루 한도에 닿은 상태를 확인할 수 있다
export const fetchTodayIssuance = async (): Promise<{
  issuedCount: number;
  dailyLimit: number;
}> => {
  if (USE_COUPON_API) {
    const { dailyLimit, issuedCount } = await fetchIssuanceLimit();
    return { dailyLimit, issuedCount };
  }

  await wait(MOCK_DELAY_MS);

  const issuedCount = new URLSearchParams(window.location.search).has(
    'mockDailyLimit',
  )
    ? MOCK_DAILY_ISSUE_LIMIT
    : getMockIssuedCount();

  return { dailyLimit: MOCK_DAILY_ISSUE_LIMIT, issuedCount };
};

// 찜 목록에서 받은 캠페인 ID를 보내 각 캠페인의 발급 상태를 한 번에 받는다
// 캠페인별 상태(:getStatus)는 아직 서버에 없어 mock이고, 하루 한도만 쿠폰 API를 쓸 수 있다
export const fetchIssueStatus = async (
  campaignIds: string[],
): Promise<IssueStatusResponse> => {
  const campaigns = campaignIds
    .map(getMockIssueStatus)
    .filter((status) => status !== undefined);
  const { dailyLimit, issuedCount } = await fetchTodayIssuance();

  return {
    campaigns,
    dailyLimit,
    dailyRemaining: Math.max(0, dailyLimit - issuedCount),
  };
};

export interface CouponPage {
  items: Coupon[];
  // 다음 페이지 커서. 마지막 페이지면 null
  nextPageToken: string | null;
}

const getMockCouponList = (filter?: CouponFilter) => {
  // 주소에 ?mockCouponsEmpty를 붙이면 받은 쿠폰이 없는 상태를 확인할 수 있다
  if (new URLSearchParams(window.location.search).has('mockCouponsEmpty')) {
    return [];
  }

  return getMockCoupons(getNow())
    .filter((coupon) => !filter || coupon.state === couponFilterStates[filter])
    .sort((a, b) => b.issueTime.localeCompare(a.issueTime));
};

// 받은 쿠폰을 한 페이지 받는다. 최근에 받은 순서이고, filter를 주면 그 상태만 받는다
// filter를 바꾸면 pageToken 없이 첫 페이지부터 다시 받아야 한다
export const fetchCouponPage = async ({
  filter,
  pageSize = 20,
  pageToken,
}: {
  filter?: CouponFilter;
  pageSize?: number;
  pageToken?: string | null;
} = {}): Promise<CouponPage> => {
  if (USE_COUPON_LIST_API) {
    const params = new URLSearchParams({ pageSize: String(pageSize) });
    if (filter) params.set('filter', `state = "${couponFilterStates[filter]}"`);
    if (pageToken) params.set('pageToken', pageToken);
    return request<CouponPage>(`/v1/coupons?${params.toString()}`);
  }

  await wait(MOCK_DELAY_MS);
  return { items: getMockCouponList(filter), nextPageToken: null };
};

// 받은 쿠폰을 마지막 페이지까지 이어서 받는다
// 미사용 쿠폰처럼 많아야 몇 장인 목록에만 쓴다. 계속 쌓이는 사용 내역은 fetchCouponPage로 나눠 받는다
export const fetchCoupons = async (
  filter?: CouponFilter,
): Promise<Coupon[]> => {
  const items: Coupon[] = [];
  let pageToken: string | null = null;

  do {
    const page: CouponPage = await fetchCouponPage({
      filter,
      pageSize: 100,
      pageToken,
    });
    items.push(...page.items);
    pageToken = page.nextPageToken;
  } while (pageToken);

  return items;
};

// 받은 쿠폰 한 장의 지금 상태 (GET /v1/coupons/{memberCouponId})
// QR을 보여주는 동안 점주가 스캔해 사용 처리했는지 확인할 때 쓴다
export const fetchCoupon = async (memberCouponId: number): Promise<Coupon> => {
  if (USE_COUPON_LIST_API) {
    return request<Coupon>(`/v1/coupons/${memberCouponId}`);
  }

  await wait(MOCK_DELAY_MS);
  const coupon = getMockCoupons(getNow()).find(
    (item) => item.memberCouponId === memberCouponId,
  );
  if (!coupon) throw new Error('쿠폰을 찾을 수 없습니다');
  return coupon;
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

// 매장에서 보여줄 1회용 QR. 서버가 그려 준 QR 이미지와 만료 시각
export interface QrToken {
  // <img src>에 바로 넣을 수 있는 이미지 주소 (data URL)
  imageSrc: string;
  expiresAt: number;
}

export const QR_TOKEN_LIFETIME_MS = 60_000;

// QR 생성은 서버 구현이 끝나 실제 API를 쓴다
const USE_COUPON_QR_API = true;

interface QrResponse {
  // QR 이미지 PNG를 Base64로 바꾼 값
  qrImageBytes: string;
  expireTime: string;
}

// mock QR 이미지. 서버처럼 이미지로 주려고 QR을 SVG 이미지 주소로 만든다
// 실제 API를 쓰면 필요 없어서 쓸 때만 불러온다
const createMockQrImage = async (value: string) => {
  const [{ createElement }, { renderToStaticMarkup }, { QRCodeSVG }] =
    await Promise.all([
      import('react'),
      import('react-dom/server'),
      import('qrcode.react'),
    ]);
  const svg = renderToStaticMarkup(
    createElement(QRCodeSVG, { value, size: 256, marginSize: 4 }),
  );
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};

// 60초 동안만 쓸 수 있는 QR을 받는다 (POST /v1/coupons/{memberCouponId}:generateQr)
// 새로 받으면 이전 QR은 바로 쓸 수 없게 된다
export const fetchQrToken = async (
  memberCouponId: number,
): Promise<QrToken> => {
  if (USE_COUPON_QR_API) {
    const data = await request<QrResponse>(
      `/v1/coupons/${memberCouponId}:generateQr`,
      { method: 'POST' },
    );
    return {
      imageSrc: `data:image/png;base64,${data.qrImageBytes}`,
      expiresAt: Date.parse(data.expireTime),
    };
  }

  await wait(MOCK_DELAY_MS);

  const issuedAt = getNow();
  return {
    imageSrc: await createMockQrImage(
      `lunch-catch:${memberCouponId}:${issuedAt}`,
    ),
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
