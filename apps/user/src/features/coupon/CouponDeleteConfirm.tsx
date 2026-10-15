import type { Coupon } from '@user/api/coupon';
import ActionButton from '@user/components/ActionButton/ActionButton';

import { formatDiscount, formatTarget } from './couponFormat';

interface CouponDeleteConfirmProps {
  coupon: Coupon;
  isDeleting: boolean;
  // 삭제하지 못했을 때 보여줄 안내
  errorMessage: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}

// 쿠폰 삭제 확인. QR 시트 위에 창을 하나 더 띄우지 않고 시트 내용을 이 화면으로 바꾼다
const CouponDeleteConfirm = ({
  coupon,
  errorMessage,
  isDeleting,
  onCancel,
  onConfirm,
}: CouponDeleteConfirmProps) => (
  <div className="flex flex-col gap-4">
    {/* 카드의 ×로 연 화면이라 어떤 쿠폰인지는 글자로만 알려 준다. 시트 안의 색은 아래 두 버튼만 남긴다 */}
    <div className="flex flex-col gap-1.5 text-body-sm-mobile break-keep">
      <p className="font-bold text-text-primary">
        {coupon.storeName} · {formatDiscount(coupon)} · {formatTarget(coupon)}
      </p>
      <ul className="flex flex-col gap-1 text-text-secondary">
        <li>· 삭제하면 오늘 쿠폰을 1장 더 받을 수 있어요</li>
        <li>· 같은 가게 쿠폰은 오늘 다시 받을 수 없어요</li>
      </ul>
    </div>
    {errorMessage && (
      <p className="text-body-sm-mobile text-status-danger-fg" role="alert">
        {errorMessage}
      </p>
    )}
    <div className="flex gap-2">
      <ActionButton onClick={onCancel} size="large" variant="secondary">
        취소
      </ActionButton>
      {/* 되돌릴 수 없는 행동이라 확인 창에서 가장 진한 버튼으로 둔다 */}
      <ActionButton
        loading={isDeleting}
        onClick={onConfirm}
        size="large"
        variant="danger"
      >
        삭제
      </ActionButton>
    </div>
  </div>
);

export default CouponDeleteConfirm;
