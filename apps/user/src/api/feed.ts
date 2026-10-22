import { request } from './client';
import { getNow } from './clock';
import { type MockFeedCard, mockFeedCards } from './mocks/feed';
import { addMockWish, isMockWishRemoved } from './mocks/wishlist';
import { BUSINESS_CATEGORY_LABELS, type BusinessCategory } from './store';

// 카드의 할인 (피드 명세 cards[].discount)
export interface FeedDiscount {
  // ALL: 전체 메뉴, MENU: 특정 메뉴
  target: 'ALL' | 'MENU';
  type: 'PERCENT' | 'AMOUNT';
  // PERCENT면 할인율(%), AMOUNT면 할인액(원)
  value: number;
}

// 피드 카드 한 장 (GET /v1/feed 의 cards[])
// 캠페인과 가게 ID는 찜·쿠폰 화면과 같이 문자열로 다룬다
export interface FeedCard {
  // 카드 1장의 식별자. 노출과 스와이프 요청에 그대로 돌려보낸다
  serveId: string;
  campaignId: string;
  storeId: string;
  storeName: string;
  category: BusinessCategory;
  // 요청 위치에서 가게까지 거리(m)
  distanceM: number;
  discount: FeedDiscount;
  // 선착순 오픈 시각과 쿠폰 사용 시간 (HH:mm)
  issueOpenTime: string;
  usableFrom: string;
  usableTo: string;
  // 선착순 발급 수량(표시용). 잔여 수량은 피드에 없다
  issueQuantity: number;
  // 포스터 주소. 받아서 그린다 (fetchPosterHtml)
  posterUrl: string;
}

// serving: 카드 있음, empty: 주변에 지금 보여줄 카드가 없음. 피드는 시간대 없이 하루 종일 받는다
// nextFeedAt: 다음 피드를 요청해도 거부되지 않는 가장 이른 시각 (이 휴대폰 시계 기준 ms). mock이면 null
export type FeedResponse =
  | { status: 'serving'; cards: FeedCard[]; nextFeedAt: number | null }
  | { status: 'empty' };

export type SwipeAction = 'wish' | 'pass';

// 피드 조회, 찜·패스, 노출은 서버 구현이 끝나 실제 API를 쓴다
// 찜 목록은 아직 mock이라, 피드에서 찜한 카드가 찜 목록에 보이지 않는다
const USE_FEED_API = true;

const MOCK_DELAY_MS = 600;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

interface FeedCardResponse {
  serveId: string;
  servedAt: string;
  campaignId: number;
  storeId: number;
  storeName: string;
  categoryCode: string;
  distanceM: number;
  discount: FeedDiscount;
  issueOpenTime: string;
  usableStartTime: string;
  usableEndTime: string;
  issueQuantity: number;
  posterUrl: string;
}

interface FeedApiResponse {
  status: 'SERVING' | 'NO_CANDIDATE';
  feedId: string | null;
  radiusM: number;
  nextFeedAvailableAt: string;
  cards: FeedCardResponse[];
}

const isBusinessCategory = (code: string): code is BusinessCategory =>
  code in BUSINESS_CATEGORY_LABELS;

const toFeedCard = (card: FeedCardResponse): FeedCard => ({
  serveId: card.serveId,
  campaignId: String(card.campaignId),
  storeId: String(card.storeId),
  storeName: card.storeName,
  // 앱이 모르는 업종 코드가 오면 기타로 본다
  category: isBusinessCategory(card.categoryCode) ? card.categoryCode : 'OTHER',
  distanceM: card.distanceM,
  discount: card.discount,
  issueOpenTime: card.issueOpenTime,
  usableFrom: card.usableStartTime,
  usableTo: card.usableEndTime,
  issueQuantity: card.issueQuantity,
  posterUrl: card.posterUrl,
});

// mock 포스터 주소. 서버 주소와 겹치지 않게 앞에 표시를 붙인다
const MOCK_POSTER_PREFIX = 'mock-poster:';

// 업종 이름(예: 일식)을 업종 코드로 바꾼다
const categoryByLabel = new Map(
  Object.entries(BUSINESS_CATEGORY_LABELS).map(([code, label]) => [
    label,
    code as BusinessCategory,
  ]),
);

// mock 카드를 서버 카드 모양으로 바꾼다. 도보 분은 분당 70m로 거리로 되돌린다
const fromMockCard = (card: MockFeedCard): FeedCard => ({
  serveId: card.serveId,
  campaignId: card.campaignId,
  storeId: card.storeId,
  storeName: card.storeName,
  category: categoryByLabel.get(card.category) ?? 'OTHER',
  distanceM: card.walkMinutes * 70,
  discount: {
    target: card.offerTitle.startsWith('전 메뉴') ? 'ALL' : 'MENU',
    type: 'PERCENT',
    value: Math.round((1 - card.salePrice / card.originalPrice) * 100),
  },
  issueOpenTime: card.issueOpenTime,
  usableFrom: card.usableFrom,
  usableTo: card.usableTo,
  issueQuantity: card.remainingCount,
  posterUrl: `${MOCK_POSTER_PREFIX}${card.campaignId}`,
});

const fetchMockFeed = async (): Promise<FeedResponse> => {
  await wait(MOCK_DELAY_MS);

  return {
    status: 'serving',
    // 찜 목록에서 삭제한 캠페인은 당일 피드에 다시 보여주지 않는다
    cards: mockFeedCards
      .filter((card) => !isMockWishRemoved(card.campaignId))
      .map(fromMockCard),
    // mock은 다음 피드가 없어 다 넘기면 끝난다
    nextFeedAt: null,
  };
};

const loadFeed = async (): Promise<FeedResponse> => {
  if (!USE_FEED_API) return fetchMockFeed();

  const data = await request<FeedApiResponse>('/v1/feed');

  if (data.status === 'NO_CANDIDATE' || data.cards.length === 0) {
    return { status: 'empty' };
  }
  // 서버 시계 기준 시각이라, 휴대폰 시계가 틀려도 맞도록 카드를 내려준 시각과의 차이만 쓴다
  const waitMs =
    Date.parse(data.nextFeedAvailableAt) - Date.parse(data.cards[0].servedAt);

  return {
    status: 'serving',
    // 받은 순서를 바꾸지 않는다 (명세의 클라이언트 규칙)
    cards: data.cards.map(toFeedCard),
    nextFeedAt: getNow() + (Number.isFinite(waitMs) ? Math.max(0, waitMs) : 0),
  };
};

// 진행 중인 피드 요청. 받는 사이 다시 부르면 새로 보내지 않고 같은 응답을 나눠 쓴다
// 피드는 60초에 6회까지라, 개발 모드에서 화면이 두 번 그려질 때 요청이 두 번 나가 횟수를 쓰지 않게 한다
let pendingFeed: Promise<FeedResponse> | null = null;

// 스와이프 피드 10장 (GET /v1/feed). 위치를 보내지 않아 서버가 저장 위치를 쓴다
// 위치가 없으면 422 ADSERVING-002, 60초에 6회를 넘기면 429 ADSERVING-003으로 실패한다
export const fetchFeed = (): Promise<FeedResponse> => {
  pendingFeed ??= loadFeed().finally(() => {
    pendingFeed = null;
  });
  return pendingFeed;
};

// 같은 주소는 항상 같은 포스터라, 한 번 받은 포스터는 다시 받지 않는다
const posterCache = new Map<string, Promise<string>>();

// 카드 포스터 HTML (GET /v1/campaigns/{campaignId}/poster). 점주가 만든 HTML이라 iframe에 격리해 그린다
export const fetchPosterHtml = (posterUrl: string): Promise<string> => {
  const cached = posterCache.get(posterUrl);
  if (cached) return cached;

  const poster = posterUrl.startsWith(MOCK_POSTER_PREFIX)
    ? Promise.resolve(
        mockFeedCards.find(
          (card) =>
            card.campaignId === posterUrl.slice(MOCK_POSTER_PREFIX.length),
        )?.posterHtml ?? '',
      )
    : request<{ html: string }>(posterUrl).then((data) => data.html);

  // 실패한 포스터는 기억하지 않아 다음에 다시 받는다
  posterCache.set(posterUrl, poster);
  poster.catch(() => posterCache.delete(posterUrl));
  return poster;
};

// 응답을 기다리지 않는 요청을 보낸다. 실패하면 한 번만 다시 보내고 포기한다 (명세의 클라이언트 규칙)
// 다시 보내도 실패하면 돌려준 Promise가 실패한다. 결과를 쓰지 않는 쪽은 무시하면 된다
const sendOnceWithRetry = (send: () => Promise<unknown>) =>
  send()
    .catch(() => send())
    .then(() => undefined);

// 탭이 뒤로 가 있으면 다시 보일 때까지 기다린다. 앱이 백그라운드에 있는 동안 본 것으로 치지 않는다
const whenVisible = (callback: () => void) => {
  if (document.visibilityState === 'visible') {
    callback();
    return;
  }
  const handleVisible = () => {
    if (document.visibilityState !== 'visible') return;
    document.removeEventListener('visibilitychange', handleVisible);
    callback();
  };
  document.addEventListener('visibilitychange', handleVisible);
};

export interface Coordinates {
  latitude: number;
  longitude: number;
}

// 카드가 맨 위에 보인 순간 노출 1회로 기록한다 (POST /v1/impressions, 광고 과금 기준)
// 위치는 피드를 받은 기준인 저장 위치를 보낸다. 서버가 소수 3자리로 반올림해 저장한다
// 응답(유효·무효 판정)은 화면에 쓰지 않는다
export const sendImpression = (card: FeedCard, location: Coordinates) => {
  if (!USE_FEED_API) return;

  whenVisible(() => {
    const body = {
      serveId: card.serveId,
      campaignId: Number(card.campaignId),
      displayedAt: new Date().toISOString(),
      latitude: location.latitude,
      longitude: location.longitude,
    };
    sendOnceWithRetry(
      () =>
        request('/v1/impressions', { method: 'POST', body, keepalive: true }),
      // 노출은 응답에 의존하지 않아 실패해도 화면에 알리지 않는다
    ).catch(() => {});
  });
};

const swipeActionValues: Record<SwipeAction, 'WISH' | 'PASS'> = {
  wish: 'WISH',
  pass: 'PASS',
};

// 카드를 찜하거나 패스한다 (POST /v1/swipes). 찜하면 서버 찜 목록에 들어간다
// 화면은 응답을 기다리지 않고 바로 다음 카드로 넘어간다. 같은 카드를 다시 보내도 서버가 처음 것만 반영한다
// 다시 보내도 실패하면 돌려준 Promise가 실패한다. 찜이면 화면이 찜 수를 바로잡는다
export const sendSwipeAction = (
  card: FeedCard,
  action: SwipeAction,
): Promise<void> => {
  if (!USE_FEED_API) {
    // mock 찜 목록은 mock 카드로만 채울 수 있다
    const mockCard = mockFeedCards.find(
      (item) => item.campaignId === card.campaignId,
    );
    if (action === 'wish' && mockCard) addMockWish(mockCard);
    return Promise.resolve();
  }

  const body = {
    serveId: card.serveId,
    campaignId: Number(card.campaignId),
    action: swipeActionValues[action],
    occurredAt: new Date().toISOString(),
  };
  return sendOnceWithRetry(() =>
    request('/v1/swipes', { method: 'POST', body, keepalive: true }),
  );
};
