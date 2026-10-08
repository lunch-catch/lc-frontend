import type { FeedCard } from './feed';
import { mockFeedCards } from './mocks/feed';
import {
  addMockWish,
  getMockWishes,
  removeMockWish,
  restoreMockWish,
} from './mocks/wishlist';

// 찜한 캠페인의 가게와 혜택 정보. 잔여 수량과 받았는지는 쿠폰(api/coupon)에서 따로 받는다
export interface WishItem {
  campaignId: string;
  storeId: string;
  storeName: string;
  imageUrl: string;
  offerTitle: string;
  originalPrice: number;
  salePrice: number;
}

const MOCK_DELAY_MS = 600;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const toWishItem = (card: FeedCard): WishItem => ({
  campaignId: card.campaignId,
  storeId: card.storeId,
  storeName: card.storeName,
  imageUrl: card.imageUrl,
  offerTitle: card.offerTitle,
  originalPrice: card.originalPrice,
  salePrice: card.salePrice,
});

// 주소에 ?mockWishlistEmpty를 붙이면 빈 찜 목록을 확인할 수 있다
export const fetchWishlist = async (): Promise<WishItem[]> => {
  await wait(MOCK_DELAY_MS);

  if (new URLSearchParams(window.location.search).has('mockWishlistEmpty')) {
    return [];
  }

  return getMockWishes().map(toWishItem);
};

// 삭제한 캠페인은 당일 피드에 다시 나오지 않고 10:50 오픈 알림 대상에서도 빠진다 (서버 처리)
export const removeWish = async (campaignId: string): Promise<void> => {
  await wait(MOCK_DELAY_MS);

  removeMockWish(campaignId);
};

// 삭제를 되돌린다. 실제 서버에서는 같은 캠페인을 다시 찜하는 요청이다
export const restoreWish = async (campaignId: string): Promise<void> => {
  await wait(MOCK_DELAY_MS);

  restoreMockWish(campaignId);
};

// 이 캠페인을 찜했는지 (GET /v1/wishlist?campaignId=)
export const fetchIsWished = async (campaignId: string): Promise<boolean> => {
  await wait(MOCK_DELAY_MS);

  return getMockWishes().some((wish) => wish.campaignId === campaignId);
};

// 가게 상세에서 찜한다 (POST /v1/wishlist)
export const addWish = async (campaignId: string): Promise<void> => {
  await wait(MOCK_DELAY_MS);

  const card = mockFeedCards.find((item) => item.campaignId === campaignId);
  if (card) addMockWish(card);
};
