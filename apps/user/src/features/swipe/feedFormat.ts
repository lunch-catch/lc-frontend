import type { FeedDiscount } from '@user/api/feed';

// 할인 문구 (예: 전 메뉴 20% 할인, 3,000원 할인)
// 피드에는 할인 메뉴 이름이 없어서 메뉴 할인은 할인만 적는다
export const formatFeedDiscount = ({ target, type, value }: FeedDiscount) => {
  const amount =
    type === 'PERCENT' ? `${value}%` : `${value.toLocaleString('ko-KR')}원`;
  return target === 'ALL' ? `전 메뉴 ${amount} 할인` : `${amount} 할인`;
};
