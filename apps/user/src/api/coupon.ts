import { ApiError, request } from './client';
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
  // 오늘의 쿠폰 이벤트 ID. 발급할 때 서버에 보낸다. 오늘 이벤트가 없거나 mock이면 null
  eventId: number | null;
  remainingCount: number;
  // 사용 시간 (HH:MM). 이벤트가 없으면 빈 문자열
  usableFrom: string;
  usableTo: string;
  // 오늘 이 캠페인 쿠폰을 이미 받았는지
  isIssued: boolean;
}

// 발급 상태를 물을 캠페인. 서버는 가게 단위로 답해서 가게 ID도 함께 넘긴다
export interface IssueTarget {
  campaignId: string;
  storeId: string;
}

export interface IssueStatusResponse {
  campaigns: CampaignIssueStatus[];
  // 하루에 받을 수 있는 쿠폰 수와 오늘 남은 횟수
  dailyLimit: number;
  dailyRemaining: number;
}

// 받기 결과. 받는 사이 수량이 소진되거나 하루 한도에 닿으면 실패한다
// alreadyIssued: 오늘 이미 받음, notWished: 찜하지 않음, notOpen: 발급 시간이 아니거나 오늘 이벤트가 없음
export type IssueResult =
  | 'issued'
  | 'soldOut'
  | 'limitReached'
  | 'alreadyIssued'
  | 'notWished'
  | 'notOpen';

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

// 발급 한도 조회는 서버 구현이 끝나 실제 API를 쓴다
// 발급 API가 나오기 전까지 찜 목록에서 mock으로 받은 쿠폰은 이 수에 들어가지 않는다
const USE_COUPON_LIMIT_API = true;

// 오늘 받은 쿠폰 수와 하루 한도
// mock일 때 주소에 ?mockDailyLimit를 붙이면 하루 한도에 닿은 상태를 확인할 수 있다
export const fetchTodayIssuance = async (): Promise<{
  issuedCount: number;
  dailyLimit: number;
}> => {
  if (USE_COUPON_LIMIT_API) {
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

// 발급(POST /v1/coupons)과 가게별 발급 상태(POST /v1/coupon-events:getStatus)는 서버 구현이 끝나 실제 API를 쓴다
// 찜 API가 아직 없어 서버 응답의 wished·canIssue는 항상 false라 쓰지 않고, 찜 여부는 화면이 따로 안다
const USE_COUPON_ISSUE_API = true;

// 가게별 오늘 쿠폰 이벤트 상태 (POST /v1/coupon-events:getStatus 응답 한 건)
interface CouponEventStatusItem {
  storeId: number;
  hasCampaign: boolean;
  eventId: number | null;
  eventState: 'SCHEDULED' | 'OPEN' | 'SOLD_OUT' | 'CLOSED' | 'NO_EVENT';
  remainingQuantity: number;
  usableStartTime: string | null;
  usableEndTime: string | null;
  hasIssuedToday: boolean;
  wished: boolean;
  canIssue: boolean;
  cannotIssueReason: string | null;
}

interface CouponEventStatusResponse {
  serverTime: string;
  items: CouponEventStatusItem[];
}

// ISO 시각을 화면에 보여줄 HH:MM으로 바꾼다
const formatClockTime = (isoString: string | null) =>
  isoString
    ? new Date(isoString).toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      })
    : '';

// 한 번에 물을 수 있는 가게 수 (명세의 storeIds 최대 개수)
const MAX_STATUS_STORE_IDS = 100;

// 가게 ID로 오늘 이벤트 상태를 받아 캠페인별 상태로 바꾼다. 가게 ID가 숫자가 아닌 캠페인(mock 데이터)은 묻지 않는다
const fetchCampaignStatuses = async (
  targets: IssueTarget[],
): Promise<CampaignIssueStatus[]> => {
  const storeIds = [
    ...new Set(
      targets.map((target) => Number(target.storeId)).filter(Number.isInteger),
    ),
  ];
  if (storeIds.length === 0) return [];

  // 한 번에 100개까지라, 넘으면 나눠 묻고 합친다. 자르면 그 가게의 찜이 목록에서 조용히 빠진다
  const chunks: number[][] = [];
  for (let start = 0; start < storeIds.length; start += MAX_STATUS_STORE_IDS) {
    chunks.push(storeIds.slice(start, start + MAX_STATUS_STORE_IDS));
  }
  const responses = await Promise.all(
    chunks.map((chunk) =>
      request<CouponEventStatusResponse>('/v1/coupon-events:getStatus', {
        method: 'POST',
        body: { storeIds: chunk },
      }),
    ),
  );
  const itemsByStore = new Map(
    responses.flatMap(({ items }) => items).map((item) => [item.storeId, item]),
  );

  return targets.flatMap((target) => {
    const item = itemsByStore.get(Number(target.storeId));
    if (!item) return [];
    return [
      {
        campaignId: target.campaignId,
        eventId: item.eventId,
        remainingCount: item.remainingQuantity,
        usableFrom: formatClockTime(item.usableStartTime),
        usableTo: formatClockTime(item.usableEndTime),
        isIssued: item.hasIssuedToday,
      },
    ];
  });
};

// 찜 목록의 캠페인들을 보내 각 캠페인의 발급 상태를 한 번에 받는다
// 하루 한도는 발급 한도 조회에서 따로 받는다
export const fetchIssueStatus = async (
  targets: IssueTarget[],
): Promise<IssueStatusResponse> => {
  const [campaigns, { dailyLimit, issuedCount }] = await Promise.all([
    USE_COUPON_ISSUE_API
      ? fetchCampaignStatuses(targets)
      : targets
          .map((target) => getMockIssueStatus(target.campaignId))
          .filter((status) => status !== undefined),
    fetchTodayIssuance(),
  ]);

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

// 아직 쓰지 않은 쿠폰을 삭제한다 (DELETE /v1/coupons/{memberCouponId})
// 받은 날의 발급 수가 1 줄어 그날 한 장을 더 받을 수 있다. 같은 이벤트 쿠폰은 다시 받을 수 없다
// 이미 삭제한 쿠폰을 다시 지워도 성공(204)이고, 사용한 쿠폰은 409 COUPON-012로 거절된다
export const deleteCoupon = (memberCouponId: number) =>
  request<void>(`/v1/coupons/${memberCouponId}`, { method: 'DELETE' });

// 마이페이지 쿠폰 요약 (GET /v1/coupons/summary). 지금까지 쌓인 누적 값이다
export interface CouponSummary {
  receivedCouponCount: number;
  usedCouponCount: number;
  // 사용할 때 확정한 할인액의 합계(원)
  totalDiscountAmount: number;
}

export const fetchCouponSummary = () =>
  request<CouponSummary>('/v1/coupons/summary');

// 가게에서 보여줄 1회용 QR. 서버가 그려 준 QR 이미지와 만료 시각
export interface QrToken {
  // <img src>에 바로 넣을 수 있는 이미지 주소 (data URL)
  imageSrc: string;
  expiresAt: number;
}

// QR을 쓸 수 있는 시간. 서버도 QR을 만든 시각에서 60초 뒤에 만료시키므로 같은 값으로 둔다
export const QR_TOKEN_LIFETIME_MS = 60_000;

// QR 생성은 서버 구현이 끝나 실제 API를 쓴다
const USE_COUPON_QR_API = true;

interface QrResponse {
  // QR 이미지 PNG를 Base64로 바꾼 값
  qrImageBytes: string;
  // 서버 시계 기준 만료 시각. 휴대폰 시계가 틀리면 어긋나서 화면에서는 쓰지 않는다
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
// 만료 시각은 서버 시각 대신 요청을 보낸 휴대폰 시각에 60초를 더해 정한다
// 휴대폰 시계가 틀려도 60초를 정확히 세고, 서버는 요청을 받은 뒤에 QR을 만들어 화면이 서버보다 먼저 만료된다
export const fetchQrToken = async (
  memberCouponId: number,
): Promise<QrToken> => {
  const requestedAt = getNow();
  const expiresAt = requestedAt + QR_TOKEN_LIFETIME_MS;

  if (USE_COUPON_QR_API) {
    const data = await request<QrResponse>(
      `/v1/coupons/${memberCouponId}:generateQr`,
      { method: 'POST' },
    );
    return {
      imageSrc: `data:image/png;base64,${data.qrImageBytes}`,
      expiresAt,
    };
  }

  await wait(MOCK_DELAY_MS);

  return {
    imageSrc: await createMockQrImage(
      `lunch-catch:${memberCouponId}:${requestedAt}`,
    ),
    expiresAt,
  };
};

// 서버가 발급을 거절한 이유를 받기 결과로 바꾼다. 여기 없는 오류는 그대로 올린다
const issueFailuresByCode: Record<string, Exclude<IssueResult, 'issued'>> = {
  'COUPON-004': 'notWished',
  'COUPON-005': 'alreadyIssued',
  'COUPON-006': 'soldOut',
  'COUPON-007': 'limitReached',
  // 발급 시간이 아니거나 이벤트가 열려 있지 않음
  'COUPON-002': 'notOpen',
};

// 선착순 쿠폰을 받는다 (POST /v1/coupons). 발급 상태에서 받은 오늘 이벤트 ID로 받는다
// mock일 때 주소에 ?mockIssueSoldOut을 붙이면 받는 사이 수량이 소진된 경우를 확인할 수 있다
export const issueCoupon = async ({
  campaignId,
  eventId,
}: Pick<
  CampaignIssueStatus,
  'campaignId' | 'eventId'
>): Promise<IssueResult> => {
  if (USE_COUPON_ISSUE_API) {
    // 오늘 이벤트가 없으면 서버에 묻지 않아도 받을 수 없다
    if (eventId === null) return 'notOpen';

    try {
      await request<{ memberCouponId: number; issueTime: string }>(
        '/v1/coupons',
        { method: 'POST', body: { eventId } },
      );
      return 'issued';
    } catch (error) {
      const failure =
        error instanceof ApiError && error.code
          ? issueFailuresByCode[error.code]
          : undefined;
      if (!failure) throw error;
      return failure;
    }
  }

  await wait(MOCK_DELAY_MS);

  if (new URLSearchParams(window.location.search).has('mockIssueSoldOut')) {
    return 'soldOut';
  }

  return issueMockCoupon(campaignId);
};
