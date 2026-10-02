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

// 오늘 찜 목록에서 삭제한 캠페인과 원래 자리. 당일 피드에 다시 보여주지 않고, 되돌리면 같은 자리에 넣는다
const removedWishes = new Map<string, { card: FeedCard; index: number }>();

export const removeMockWish = (campaignId: string) => {
  const index = wishedCards.findIndex((card) => card.campaignId === campaignId);
  if (index === -1) return;

  const [card] = wishedCards.splice(index, 1);
  removedWishes.set(campaignId, { card, index });
};

export const restoreMockWish = (campaignId: string) => {
  const removed = removedWishes.get(campaignId);
  if (!removed) return;

  wishedCards.splice(removed.index, 0, removed.card);
  removedWishes.delete(campaignId);
};

export const isMockWishRemoved = (campaignId: string) =>
  removedWishes.has(campaignId);
