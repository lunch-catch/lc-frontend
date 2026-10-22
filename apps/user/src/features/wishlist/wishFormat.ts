import type { WishDiscount } from '@user/api/wishlist';

// 할인 대상 (예: 갈비살 정식, 전 메뉴)
export const formatWishTarget = ({ menuName, target }: WishDiscount) =>
  target === 'ALL' ? '전 메뉴' : (menuName ?? '대표 메뉴');

// 할인 크기 (예: 20% 할인, 3,000원 할인)
export const formatWishAmount = ({ type, value }: WishDiscount) =>
  type === 'PERCENT'
    ? `${value}% 할인`
    : `${value.toLocaleString('ko-KR')}원 할인`;
