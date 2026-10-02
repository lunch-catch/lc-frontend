// 찜 카드 한 장이 보여줄 상태
export type WishState =
  'beforeOpen' | 'available' | 'soldOut' | 'limitReached' | 'issued';

// 찜 목록에서 보여줄 순서. 11:00 선착순에 받을 수 있는 카드를 바로 찾도록 맨 위에 두고,
// 받은 카드, 더 받을 수 없는 카드 순으로 내린다. 같은 순위끼리는 찜한 순서를 유지한다
export const WISH_STATE_ORDER: Record<WishState, number> = {
  available: 0,
  beforeOpen: 0,
  issued: 1,
  soldOut: 2,
  limitReached: 2,
};

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
