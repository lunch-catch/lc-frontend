import type { EventStatus } from '@user/api/coupon';

// 찜 카드 한 장이 보여줄 상태
// closed: 14:00 발급 마감이 지나 오늘은 받을 수 없음. 피드가 하루 종일 열려 있어 저녁에도 찜 목록을 본다
export type WishState =
  | 'beforeOpen'
  | 'available'
  | 'soldOut'
  | 'noEvent'
  | 'limitReached'
  | 'closed'
  | 'issued';

// 찜 목록에서 보여줄 순서. 11:00 선착순에 받을 수 있는 카드를 바로 찾도록 맨 위에 두고,
// 받은 카드, 오늘은 더 받을 수 없지만 내일 다시 받을 카드 순으로 내린다. 같은 순위끼리는 찜한 순서를 유지한다
// 받은 뒤 쓰거나 만료된 카드는 그 아래다 (WishlistScreen의 CARD_STATE_ORDER)
export const WISH_STATE_ORDER: Record<WishState, number> = {
  available: 0,
  beforeOpen: 0,
  issued: 1,
  soldOut: 2,
  noEvent: 2,
  limitReached: 2,
  // 마감 뒤에는 모든 카드가 같은 상태라 찜한 순서 그대로 둔다
  closed: 2,
};

interface WishStateInput {
  // 11:00 선착순 오픈이 지났는지
  isOpen: boolean;
  // 14:00 발급 마감이 지났는지
  isClosed: boolean;
  isIssued: boolean;
  eventStatus: EventStatus;
  dailyRemaining: number;
}

// 앞에 있는 조건이 먼저다. 이미 받은 쿠폰은 한도나 소진, 마감과 상관없이 받음으로 보여주고,
// 하루 한도에 닿으면 소진된 캠페인도 한도 안내로 통일한다 (Figma wishlist-daily-limit)
// 이벤트는 11:00에 만들어져 오픈 전에는 없는 게 정상이라, 이벤트 없음은 오픈 뒤에만 본다
export const getWishState = ({
  dailyRemaining,
  eventStatus,
  isClosed,
  isIssued,
  isOpen,
}: WishStateInput): WishState => {
  if (isIssued) return 'issued';
  if (isClosed) return 'closed';
  if (!isOpen) return 'beforeOpen';
  if (dailyRemaining === 0) return 'limitReached';
  if (eventStatus === 'noEvent') return 'noEvent';
  if (eventStatus === 'soldOut') return 'soldOut';
  return 'available';
};
