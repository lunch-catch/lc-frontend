import type { Coupon } from '@user/api/coupon';

export const formatPrice = (price: number) =>
  `${price.toLocaleString('ko-KR')}원`;

// 서버가 주는 시각(ISO)을 12:30 모양으로 바꾼다
export const formatClock = (isoString: string) =>
  new Date(isoString).toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    hour12: false,
    minute: '2-digit',
  });

// 할인 크기 (예: 3,000원 할인, 20% 할인)
export const formatDiscount = ({ discountType, discountValue }: Coupon) =>
  discountType === 'PERCENT'
    ? `${discountValue}% 할인`
    : `${formatPrice(discountValue)} 할인`;

// 할인 대상. 메뉴 할인이면 메뉴 이름, 전 메뉴 할인이면 "전 메뉴"
export const formatTarget = (coupon: Coupon) =>
  coupon.targetMenu?.name ?? '전 메뉴';

// 사용 가능 시간 (예: 11:30–14:00)
export const formatUsableTime = (coupon: Coupon) =>
  `${formatClock(coupon.usableStartTime)}–${formatClock(coupon.usableEndTime)}`;
