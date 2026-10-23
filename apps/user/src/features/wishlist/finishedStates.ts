import type { WishCardState } from './WishCard';

// 오늘 더 할 일이 없는 카드 상태 (쿠폰 없음, 사용 완료, 만료, 삭제함)
// 찜 목록에서는 접는 묶음에 모으고, 카드는 점선 아래 줄 없이 얇게 보여준다
export const FINISHED_TODAY_STATES: WishCardState[] = [
  'noEvent',
  'used',
  'expired',
  'removed',
];

export const isFinishedToday = (state: WishCardState) =>
  FINISHED_TODAY_STATES.includes(state);
