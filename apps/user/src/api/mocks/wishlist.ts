import type { FeedCard } from '@user/api/feed';

// 찜한 캠페인 목록. mock 단계라 새로고침하면 비워진다
const wishedCards: FeedCard[] = [];

export const addMockWish = (card: FeedCard) => {
  if (!wishedCards.some((wished) => wished.campaignId === card.campaignId)) {
    wishedCards.push(card);
  }
};

export const getMockWishes = () => [...wishedCards];
