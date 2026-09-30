import { mockFeedCards } from './mocks/feed';
import { addMockWish } from './mocks/wishlist';

export interface FeedCard {
  serveId: string;
  campaignId: string;
  storeId: string;
  storeName: string;
  category: string;
  walkMinutes: number;
  imageUrl: string;
  offerTitle: string;
  originalPrice: number;
  salePrice: number;
  issueOpenTime: string;
  usableFrom: string;
  usableTo: string;
  remainingCount: number;
}

// 서빙 시간대(10:00~12:59) 밖이면 서버가 카드 없이 closed를 돌려준다
export type FeedResponse =
  { status: 'serving'; cards: FeedCard[] } | { status: 'closed' };

export type SwipeAction = 'wish' | 'pass';

const MOCK_DELAY_MS = 600;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const fetchFeed = async (): Promise<FeedResponse> => {
  await wait(MOCK_DELAY_MS);

  // 개발 중에는 시간과 상관없이 피드를 보여주고,
  // 주소에 ?mockFeedClosed를 붙이면 서빙 시간 외 화면을 확인할 수 있다
  if (new URLSearchParams(window.location.search).has('mockFeedClosed')) {
    return { status: 'closed' };
  }

  return {
    status: 'serving',
    cards: mockFeedCards.map((card) => ({ ...card })),
  };
};

export const sendSwipeAction = async (
  card: FeedCard,
  action: SwipeAction,
): Promise<void> => {
  if (action === 'wish') {
    addMockWish(card);
  }
};
