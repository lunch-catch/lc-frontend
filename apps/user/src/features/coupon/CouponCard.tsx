import type { ReactNode } from 'react';

import type { Coupon } from '@user/api/coupon';

interface CouponCardProps {
  coupon: Coupon;
  // 카드 세 번째 줄. 쿠폰 상태에 따라 사용 시간이나 사용 날짜를 보여준다
  detail: ReactNode;
  // 오른쪽 끝에 두는 표시 (QR 보기 등)
  action?: ReactNode;
  // 이미 쓴 쿠폰처럼 더 쓸 수 없는 쿠폰은 사진을 흑백으로 흐리게 보여준다
  dimmed?: boolean;
  // 넘기면 카드 전체가 버튼이 된다
  onClick?: () => void;
  // 카드 전체가 버튼일 때 화면 낭독기가 읽을 이름
  label?: string;
}

const formatPrice = (price: number) => `${price.toLocaleString('ko-KR')}원`;

// 쿠폰함의 받은 쿠폰 한 장
const CouponCard = ({
  action,
  coupon,
  detail,
  dimmed = false,
  label,
  onClick,
}: CouponCardProps) => {
  const content = (
    <>
      <img
        alt=""
        className={`size-18 shrink-0 rounded-lg bg-surface-subtle object-cover ${
          dimmed ? 'opacity-60 grayscale' : ''
        }`}
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
    </>
  );

  return (
    <li className="overflow-hidden rounded-xl border border-border-subtle bg-bg-surface">
      {onClick ? (
        // 매장에서 급하게 열 때 작은 버튼을 정확히 누르지 않아도 되도록 카드 전체를 누를 수 있게 한다
        <button
          aria-label={label}
          className="flex w-full items-center gap-3 p-4 text-left transition-colors active:bg-surface-subtle focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-action-primary"
          onClick={onClick}
          type="button"
        >
          {content}
        </button>
      ) : (
        <div className="flex items-center gap-3 p-4">{content}</div>
      )}
    </li>
  );
};

export default CouponCard;
