import { mockFeedCards } from './mocks/feed';
import {
  addMockWish,
  getMockWishes,
  isMockWishRemoved,
} from './mocks/wishlist';

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
  // 점주가 템플릿으로 만든 포스터 HTML. 관리자 검증을 거쳐 스크립트와 외부 리소스가 없는 것만 내려온다
  posterHtml: string;
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
    // 찜 목록에서 삭제한 캠페인은 당일 피드에 다시 보여주지 않는다
    cards: mockFeedCards
      .filter((card) => !isMockWishRemoved(card.campaignId))
      .map((card) => ({ ...card })),
  };
};

// 카드가 맨 위에 보인 순간 노출 1회로 기록한다 (광고 과금 기준)
// 서버가 없어 지금은 아무것도 하지 않는다
export const sendImpression = async (card: FeedCard): Promise<void> => {
  void card;
};

export const sendSwipeAction = async (
  card: FeedCard,
  action: SwipeAction,
): Promise<void> => {
  if (action === 'wish') {
    addMockWish(card);
  }
};

export const getWishCount = () => getMockWishes().length;
