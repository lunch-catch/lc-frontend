import type { EventStatus } from '@user/api/coupon';
import { getWishState, type WishState } from '@user/ui/wishState';

// 가게 상세 하단 버튼이 보여줄 쿠폰 상태
// 찜 목록과 같은 상태에, 오픈 전과 마감 뒤에는 찜했는지에 따라 할 일이 달라 둘로 나눈다
export type CouponState =
  | Exclude<WishState, 'beforeOpen' | 'closed'>
  | 'beforeOpenWished'
  | 'beforeOpenNotWished'
  | 'closedWished'
  | 'closedNotWished';

interface CouponStateInput {
  isOpen: boolean;
  isClosed: boolean;
  isWished: boolean;
  isIssued: boolean;
  eventStatus: EventStatus;
  dailyRemaining: number;
}

export const getCouponState = ({
  isWished,
  ...input
}: CouponStateInput): CouponState => {
  const state = getWishState(input);
  if (state === 'beforeOpen') {
    return isWished ? 'beforeOpenWished' : 'beforeOpenNotWished';
  }
  if (state === 'closed') {
    return isWished ? 'closedWished' : 'closedNotWished';
  }
  return state;
};
