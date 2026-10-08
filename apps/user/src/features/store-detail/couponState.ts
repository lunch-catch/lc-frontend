import {
  getWishState,
  type WishState,
} from '@user/features/wishlist/wishState';

// 가게 상세 하단 버튼이 보여줄 쿠폰 상태
// 찜 목록과 같은 상태에, 오픈 전에는 찜했는지에 따라 할 일이 달라 둘로 나눈다
export type CouponState =
  Exclude<WishState, 'beforeOpen'> | 'beforeOpenWished' | 'beforeOpenNotWished';

interface CouponStateInput {
  isOpen: boolean;
  isWished: boolean;
  isIssued: boolean;
  remainingCount: number;
  dailyRemaining: number;
}

export const getCouponState = ({
  isWished,
  ...input
}: CouponStateInput): CouponState => {
  const state = getWishState(input);
  if (state !== 'beforeOpen') return state;
  return isWished ? 'beforeOpenWished' : 'beforeOpenNotWished';
};
