import { request } from './client';
import { type MockFeedCard, mockFeedCards } from './mocks/feed';
import {
  addMockWish,
  getMockWishes,
  removeMockWish,
  restoreMockWish,
} from './mocks/wishlist';

// 찜한 캠페인의 할인 (찜 목록 명세 wishlist[].discount)
export interface WishDiscount {
  // ALL: 전체 메뉴, MENU: 특정 메뉴
  target: 'ALL' | 'MENU';
  type: 'PERCENT' | 'AMOUNT';
  // PERCENT면 할인율(%), AMOUNT면 할인액(원)
  value: number;
  // 할인 대상 메뉴 이름. 전체 메뉴 할인이면 null
  menuName: string | null;
}

// 찜한 캠페인의 가게와 혜택 정보. 잔여 수량과 받았는지는 쿠폰(api/coupon)에서 따로 받는다
// 오늘 노출 후보가 아닌 캠페인은 서버가 가게 이름, 사진, 할인을 비워서 준다
export interface WishItem {
  campaignId: string;
  storeId: string;
  storeName: string | null;
  imageUrl: string | null;
  discount: WishDiscount | null;
}

// 찜 목록 조회와 가게 상세 찜(POST /v1/wishlist)은 서버 구현이 끝나 실제 API를 쓴다
const USE_WISHLIST_API = true;
// 찜 삭제(DELETE /v1/wishlist/{campaignId})는 명세에는 있지만 아직 서버에 없어 mock이다
// 서버에 올라오면 켠다. 그 전까지는 지운 찜이 새로 불러올 때 다시 보인다
const USE_WISH_REMOVE_API = false;

const MOCK_DELAY_MS = 600;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

interface WishlistItemResponse {
  campaignId: number;
  storeId: number;
  storeName: string | null;
  storeImageUrl: string | null;
  discount: WishDiscount | null;
  wishedAt: string;
}

const toWishItem = (item: WishlistItemResponse): WishItem => ({
  campaignId: String(item.campaignId),
  storeId: String(item.storeId),
  storeName: item.storeName,
  imageUrl: item.storeImageUrl,
  discount: item.discount,
});

// mock 카드를 찜 목록 모양으로 바꾼다. 할인은 정가와 할인가로 할인율을 계산한다
const fromMockCard = (card: MockFeedCard): WishItem => ({
  campaignId: card.campaignId,
  storeId: card.storeId,
  storeName: card.storeName,
  imageUrl: card.imageUrl,
  discount: {
    target: card.offerTitle.startsWith('전 메뉴') ? 'ALL' : 'MENU',
    type: 'PERCENT',
    value: Math.round((1 - card.salePrice / card.originalPrice) * 100),
    menuName: card.offerTitle.startsWith('전 메뉴') ? null : card.offerTitle,
  },
});

// 서버 캠페인 ID는 숫자다. 가게 상세처럼 아직 mock 데이터(campaign-1 같은 ID)를 쓰는 화면은 mock으로 처리한다
const isServerId = (campaignId: string) => /^\d+$/.test(campaignId);

const fetchServerWishlist = async (campaignId?: string) => {
  const query = campaignId ? `?campaignId=${campaignId}` : '';
  const { wishlist } = await request<{ wishlist: WishlistItemResponse[] }>(
    `/v1/wishlist${query}`,
  );
  return wishlist.map(toWishItem);
};

// 찜 목록 (GET /v1/wishlist). 찜한 시각이 최근인 순서다
// mock일 때 주소에 ?mockWishlistEmpty를 붙이면 빈 찜 목록을 확인할 수 있다
export const fetchWishlist = async (): Promise<WishItem[]> => {
  if (USE_WISHLIST_API) return fetchServerWishlist();

  await wait(MOCK_DELAY_MS);

  if (new URLSearchParams(window.location.search).has('mockWishlistEmpty')) {
    return [];
  }

  return getMockWishes().map(fromMockCard);
};

// 이 캠페인을 찜했는지 (GET /v1/wishlist?campaignId=). 찜하지 않았으면 서버가 빈 목록을 준다
export const fetchIsWished = async (campaignId: string): Promise<boolean> => {
  if (USE_WISHLIST_API && isServerId(campaignId)) {
    return (await fetchServerWishlist(campaignId)).length > 0;
  }

  await wait(MOCK_DELAY_MS);

  return getMockWishes().some((wish) => wish.campaignId === campaignId);
};

// 찜한 캠페인 수. 피드와 탐색 헤더의 "찜 목록 N"에 쓴다
// 오늘 노출 후보가 아닌 캠페인(가게 이름이 비어 옴)은 찜 목록 화면에 나오지 않아 세지 않는다
export const fetchWishCount = async () =>
  (await fetchWishlist()).filter((wish) => wish.storeName !== null).length;

// 가게 상세에서 찜한다 (POST /v1/wishlist). 이미 찜했어도 성공이다
// 오늘 노출 중인 캠페인이 아니면 404 ADSERVING-004로 실패한다
export const addWish = async (campaignId: string): Promise<void> => {
  if (USE_WISHLIST_API && isServerId(campaignId)) {
    await request('/v1/wishlist', {
      method: 'POST',
      body: { campaignId: Number(campaignId) },
    });
    return;
  }

  await wait(MOCK_DELAY_MS);

  const card = mockFeedCards.find((item) => item.campaignId === campaignId);
  if (card) addMockWish(card);
};

// 찜을 지운다 (DELETE /v1/wishlist/{campaignId}). 찜 목록에 없어도 성공이다
// 지운 캠페인은 당일 피드에 다시 나오지 않고 10:50 오픈 알림 대상에서도 빠진다 (서버 처리)
export const removeWish = async (campaignId: string): Promise<void> => {
  if (isServerId(campaignId)) {
    // 삭제 API가 없는데 성공처럼 보이면 새로고침 뒤 다시 나타난다. 실패로 돌려 화면이 카드를 되돌리게 한다
    if (!USE_WISH_REMOVE_API) {
      throw new Error('찜 삭제 API가 아직 없습니다');
    }
    await request(`/v1/wishlist/${campaignId}`, { method: 'DELETE' });
    return;
  }

  await wait(MOCK_DELAY_MS);

  removeMockWish(campaignId);
};

// 삭제를 되돌린다. 서버에서는 같은 캠페인을 다시 찜하는 요청이다
// 삭제가 mock인 동안은 서버 찜이 그대로 남아 있어, 다시 찜해도 이미 찜한 것(200)으로 성공한다
export const restoreWish = async (campaignId: string): Promise<void> => {
  if (USE_WISHLIST_API && isServerId(campaignId)) {
    await addWish(campaignId);
    return;
  }

  await wait(MOCK_DELAY_MS);

  restoreMockWish(campaignId);
};
