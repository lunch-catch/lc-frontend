import type { StoreActiveCampaign } from '@user/api/store';

// 점심에 걸어가는 속도 (분당 약 70m, 시속 약 4km)
const WALK_METERS_PER_MINUTE = 70;

// 걸어서 몇 분인지 (예: 도보 5분). 점심 장소는 거리보다 걸리는 시간으로 고르므로 m 대신 분으로 보여준다
// 직선거리로 계산해 실제 길보다 조금 짧게 나올 수 있다
export const formatWalkTime = (meters: number) =>
  `도보 ${Math.max(1, Math.round(meters / WALK_METERS_PER_MINUTE))}분`;

// 할인 요약 (예: 20% 할인, 3,000원 할인)
export const formatDiscount = ({
  discountType,
  discountValue,
}: StoreActiveCampaign) =>
  discountType === 'PERCENT'
    ? `${discountValue}% 할인`
    : `${discountValue.toLocaleString('ko-KR')}원 할인`;
