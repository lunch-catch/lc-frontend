import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { BottomSheet } from '@repo/ui';

import { type Coupon, fetchCoupons } from '@user/api/coupon';
import mascotEmpty from '@user/assets/illustrations/mascot-empty.webp';
import ActionButton from '@user/components/ActionButton/ActionButton';
import EmptyState from '@user/components/EmptyState/EmptyState';

import CouponCard from './CouponCard';
import { formatUsableTime } from './couponFormat';
import CouponListSkeleton from './CouponListSkeleton';
import CouponLoadError from './CouponLoadError';
import CouponQr from './CouponQr';

// 쿠폰함 사용 가능 탭. 받은 쿠폰 중 아직 쓰지 않은 쿠폰과 QR
const AvailableCoupons = () => {
  const navigate = useNavigate();
  // undefined면 불러오는 중, null이면 실패
  const [coupons, setCoupons] = useState<Coupon[] | null>();
  // 다시 시도할 때마다 올려서 요청을 새로 보낸다
  const [attempt, setAttempt] = useState(0);
  // QR을 띄운 쿠폰. 계산대에서 빨리 열고 닫도록 페이지를 옮기지 않고 시트로 띄운다
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);

  useEffect(() => {
    let ignore = false;

    // 사용 시작 전 쿠폰도 여기서 보여주고 QR 화면에서 시작 시각을 알려 준다
    fetchCoupons('issued')
      .then((items) => {
        if (!ignore) setCoupons(items);
      })
      .catch(() => {
        if (!ignore) setCoupons(null);
      });

    // 응답 전에 화면을 벗어나면 결과를 버린다
    return () => {
      ignore = true;
    };
  }, [attempt]);

  const retry = () => {
    setCoupons(undefined);
    setAttempt((current) => current + 1);
  };

  if (coupons?.length === 0) {
    return (
      <EmptyState
        description="찜한 포스터는 11:00부터 찜 목록에서 받을 수 있어요"
        image={mascotEmpty}
        title="사용 가능한 쿠폰이 없어요"
      >
        <ActionButton onClick={() => navigate('/swipe')}>
          점심 포스터 보기
        </ActionButton>
      </EmptyState>
    );
  }

  return (
    <div className="px-page pt-4 pb-6">
      {coupons === null && <CouponLoadError onRetry={retry} />}
      {coupons === undefined && (
        <>
          <CouponListSkeleton />
          <p className="sr-only" role="status">
            쿠폰을 불러오는 중이에요
          </p>
        </>
      )}
      {coupons && (
        <ul className="flex flex-col gap-3">
          {coupons.map((coupon) => (
            <CouponCard
              action={
                <span className="shrink-0 rounded-lg bg-surface-brand px-3 py-1.5 text-caption-mobile font-bold text-text-brand">
                  QR 보기
                </span>
              }
              coupon={coupon}
              // 쿠폰은 받은 날 사용 시간 안에만 쓸 수 있다
              detail={`사용 ${formatUsableTime(coupon)} · 오늘`}
              key={coupon.memberCouponId}
              label={`${coupon.storeName} 쿠폰 QR 보기`}
              onClick={() => setSelectedCoupon(coupon)}
            />
          ))}
        </ul>
      )}
      {/* 시트를 닫으면 QR 화면이 사라지면서 QR 갱신 타이머도 멈춘다 */}
      <BottomSheet
        isOpen={selectedCoupon !== null}
        onClose={() => setSelectedCoupon(null)}
        title="쿠폰 사용"
      >
        {selectedCoupon && <CouponQr coupon={selectedCoupon} />}
      </BottomSheet>
    </div>
  );
};

export default AvailableCoupons;
