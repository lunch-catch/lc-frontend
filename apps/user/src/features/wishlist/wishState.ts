// 찜 카드 한 장이 보여줄 상태
export type WishState =
  'beforeOpen' | 'available' | 'soldOut' | 'limitReached' | 'issued';

interface WishStateInput {
  // 11:00 선착순 오픈이 지났는지
  isOpen: boolean;
  isIssued: boolean;
  remainingCount: number;
  dailyRemaining: number;
}

// 앞에 있는 조건이 먼저다. 이미 받은 쿠폰은 한도나 소진과 상관없이 받음으로 보여주고,
// 하루 한도에 닿으면 소진된 캠페인도 한도 안내로 통일한다 (Figma wishlist-daily-limit)
export const getWishState = ({
  dailyRemaining,
  isIssued,
  isOpen,
  remainingCount,
}: WishStateInput): WishState => {
  if (isIssued) return 'issued';
  if (!isOpen) return 'beforeOpen';
  if (dailyRemaining === 0) return 'limitReached';
  if (remainingCount === 0) return 'soldOut';
  return 'available';
};
