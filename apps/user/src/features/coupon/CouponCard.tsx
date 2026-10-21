import type { ReactNode } from 'react';
import { Store, X } from 'lucide-react';

import type { Coupon } from '@user/api/coupon';
import Card from '@user/ui/Card/Card';

import { formatDiscount, formatTarget } from './couponFormat';

interface CouponCardProps {
  coupon: Coupon;
  // 카드 세 번째 줄. 쿠폰 상태에 따라 사용 시간이나 사용 날짜를 보여준다
  detail: ReactNode;
  // 카드 아래에 두는 버튼 (QR 보기 등). 찜 목록 카드의 받기 버튼과 같은 자리다
  footer?: ReactNode;
  // 이미 쓴 쿠폰처럼 더 쓸 수 없는 쿠폰은 사진을 흑백으로 흐리게 보여준다
  dimmed?: boolean;
  // 넘기면 오른쪽 위에 삭제(×) 버튼을 둔다. 찜 목록 카드와 같은 자리다
  onRemove?: () => void;
}

// 쿠폰함의 받은 쿠폰 한 장
const CouponCard = ({
  coupon,
  detail,
  dimmed = false,
  footer,
  onRemove,
}: CouponCardProps) => (
  <Card as="li" className="relative flex flex-col gap-2.5 p-3">
    {onRemove && (
      <button
        aria-label={`${coupon.storeName} 쿠폰 삭제`}
        className="absolute top-1 right-1 flex size-10 items-center justify-center rounded-full text-text-tertiary active:bg-surface-subtle focus-visible:outline-2 focus-visible:outline-action-primary"
        onClick={onRemove}
        type="button"
      >
        <X aria-hidden="true" className="size-4" />
      </button>
    )}
    <div className="flex items-center gap-3">
      {coupon.storeImageUrl ? (
        <img
          alt=""
          className={`size-14 shrink-0 rounded-lg bg-surface-subtle object-cover ${
            dimmed ? 'opacity-60 grayscale' : ''
          }`}
          height={72}
          src={coupon.storeImageUrl}
          width={72}
        />
      ) : (
        // 가게 사진이 없으면 회색 바탕에 가게 아이콘을 둔다
        <div
          aria-hidden="true"
          className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-surface-subtle text-text-tertiary"
        >
          <Store className="size-6" />
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {/* 삭제 버튼이 있으면 가게 이름이 그 밑으로 들어가지 않게 오른쪽을 비운다 */}
        <h3
          className={`truncate text-body-mobile font-bold text-text-primary ${onRemove ? 'pr-6' : ''}`}
        >
          {coupon.storeName}
        </h3>
        {/* 공간이 좁아 글자가 잘리면 메뉴 이름 쪽이 잘리도록 할인 금액을 앞에 둔다 */}
        <p className="truncate text-caption-mobile text-text-secondary">
          <strong className="font-bold text-text-primary">
            {formatDiscount(coupon)}
          </strong>{' '}
          · {formatTarget(coupon)}
        </p>
        <p className="truncate text-caption-mobile font-medium text-text-secondary">
          {detail}
        </p>
      </div>
    </div>
    {footer}
  </Card>
);

export default CouponCard;
