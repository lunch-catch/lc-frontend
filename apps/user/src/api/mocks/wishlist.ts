import type { FeedCard } from '@user/api/feed';

import { mockFeedCards } from './feed';

// 찜 목록 화면을 바로 볼 수 있도록 미리 찜해 둔 캠페인
const INITIAL_WISH_CAMPAIGN_IDS = ['campaign-3', 'campaign-4'];

// 찜한 캠페인 목록. mock 단계라 새로고침하면 처음 상태로 돌아간다
const wishedCards: FeedCard[] = mockFeedCards.filter((card) =>
  INITIAL_WISH_CAMPAIGN_IDS.includes(card.campaignId),
);

export const addMockWish = (card: FeedCard) => {
  if (!wishedCards.some((wished) => wished.campaignId === card.campaignId)) {
    wishedCards.push(card);
  }
};

export const getMockWishes = () => [...wishedCards];
