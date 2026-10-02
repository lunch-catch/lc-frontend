import type { ReactNode } from 'react';

import type { Coupon } from '@user/api/coupon';

interface CouponCardProps {
  coupon: Coupon;
  // 카드 세 번째 줄. 쿠폰 상태에 따라 사용 시간이나 사용 날짜를 보여준다
  detail: ReactNode;
  // 오른쪽 끝에 두는 버튼 (QR 보기 등)
  action?: ReactNode;
}

const formatPrice = (price: number) => `${price.toLocaleString('ko-KR')}원`;

// 쿠폰함의 받은 쿠폰 한 장
const CouponCard = ({ action, coupon, detail }: CouponCardProps) => {
  return (
    <li className="flex items-center gap-3 rounded-xl border border-border-subtle bg-bg-surface p-4">
      <img
        alt=""
        className="size-18 shrink-0 rounded-lg bg-surface-subtle object-cover"
        height={72}
        src={coupon.imageUrl}
        width={72}
      />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <h3 className="truncate text-body-mobile font-bold text-text-primary">
          {coupon.storeName}
        </h3>
        {/* 공간이 좁아 글자가 잘리면 메뉴 이름 쪽이 잘리도록 할인 금액을 앞에 둔다 */}
        <p className="truncate text-caption-mobile text-text-secondary">
          <strong className="font-bold text-text-primary">
            {formatPrice(coupon.originalPrice - coupon.salePrice)} 할인
          </strong>{' '}
          · {coupon.offerTitle}
        </p>
        <p className="truncate text-caption-mobile font-medium text-text-secondary">
          {detail}
        </p>
      </div>
      {action}
    </li>
  );
};

export default CouponCard;
