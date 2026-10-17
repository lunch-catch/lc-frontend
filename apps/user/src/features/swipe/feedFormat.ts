import type { FeedDiscount } from '@user/api/feed';

// 점심에 걸어가는 속도 (분당 약 70m, 시속 약 4km). 탐색 탭과 같은 값이다
const WALK_METERS_PER_MINUTE = 70;

// 걸어서 몇 분인지 (예: 도보 5분). 직선거리로 계산해 실제 길보다 조금 짧게 나올 수 있다
export const formatWalkTime = (meters: number) =>
  `도보 ${Math.max(1, Math.round(meters / WALK_METERS_PER_MINUTE))}분`;

// 할인 문구 (예: 전 메뉴 20% 할인, 3,000원 할인)
// 피드에는 할인 메뉴 이름이 없어서 메뉴 할인은 할인만 적는다
export const formatFeedDiscount = ({ target, type, value }: FeedDiscount) => {
  const amount =
    type === 'PERCENT' ? `${value}%` : `${value.toLocaleString('ko-KR')}원`;
  return target === 'ALL' ? `전 메뉴 ${amount} 할인` : `${amount} 할인`;
};
