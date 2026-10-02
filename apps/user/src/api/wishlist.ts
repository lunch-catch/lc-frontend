import type { FeedCard } from './feed';
import { getMockWishes } from './mocks/wishlist';

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
