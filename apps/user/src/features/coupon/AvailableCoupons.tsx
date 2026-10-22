import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { BottomSheet } from '@repo/ui';
import { Clock, QrCode } from 'lucide-react';

import { ApiError } from '@user/api/client';
import { type Coupon, deleteCoupon, fetchCoupons } from '@user/api/coupon';
import mascotCouponEmpty from '@user/assets/illustrations/mascot-coupon-empty.webp';
import { useDelayedLoading } from '@user/hooks/useDelayedLoading';
import ActionButton from '@user/ui/ActionButton/ActionButton';
import EmptyState from '@user/ui/EmptyState/EmptyState';
import FeedbackToast from '@user/ui/FeedbackToast/FeedbackToast';
import {
  ticketPillClassName,
  ticketPressableClassName,
} from '@user/ui/Ticket/Ticket';

import CouponCard from './CouponCard';
import CouponDeleteConfirm from './CouponDeleteConfirm';
import { formatUsableTime } from './couponFormat';
import CouponListSkeleton from './CouponListSkeleton';
import CouponLoadError from './CouponLoadError';
import CouponQr from './CouponQr';

const TOAST_DURATION_MS = 2500;

// 쿠폰함 사용 가능 탭. 받은 쿠폰 중 아직 쓰지 않은 쿠폰과 QR
const AvailableCoupons = () => {
  const navigate = useNavigate();
  // undefined면 불러오는 중, null이면 실패
  const [coupons, setCoupons] = useState<Coupon[] | null>();
  // 다시 시도할 때마다 올려서 요청을 새로 보낸다
  const [attempt, setAttempt] = useState(0);
  // QR을 띄운 쿠폰. 계산대에서 빨리 열고 닫도록 페이지를 옮기지 않고 시트로 띄운다
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  // 카드를 누르면 QR을, 카드의 ×를 누르면 삭제 확인을 시트로 띄운다
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  // 시트를 닫을 때마다 올린다. 삭제 중에 시트를 닫고 다른 쿠폰을 열면, 앞 삭제의 응답이 새 시트를 건드리지 않게 한다
  const sheetSession = useRef(0);
  const showSkeleton = useDelayedLoading(coupons === undefined);

  useEffect(() => {
    if (!toastMessage) return;

    const timer = setTimeout(() => setToastMessage(null), TOAST_DURATION_MS);
    return () => clearTimeout(timer);
  }, [toastMessage]);

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

  // 시트를 닫는다. QR을 띄운 사이 사용했을 수 있어 목록을 조용히 다시 받는다
  const closeSheet = () => {
    sheetSession.current += 1;
    setSelectedCoupon(null);
    setIsConfirmingDelete(false);
    setIsDeleting(false);
    setDeleteError(null);
    setAttempt((current) => current + 1);
  };

  const handleDelete = async () => {
    if (!selectedCoupon || isDeleting) return;

    const session = sheetSession.current;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteCoupon(selectedCoupon.memberCouponId);
      setToastMessage('쿠폰을 삭제했어요');
      // 그사이 시트를 닫았으면 시트는 그대로 두고 목록만 다시 받는다
      if (session === sheetSession.current) {
        closeSheet();
      } else {
        setAttempt((current) => current + 1);
      }
    } catch (error) {
      if (session !== sheetSession.current) return;
      setDeleteError(
        error instanceof ApiError && error.code === 'COUPON-012'
          ? '이미 사용한 쿠폰이라 삭제할 수 없어요'
          : '쿠폰을 삭제하지 못했어요',
      );
      setIsDeleting(false);
    }
  };

  const retry = () => {
    setCoupons(undefined);
    setAttempt((current) => current + 1);
  };

  if (coupons?.length === 0) {
    return (
      <EmptyState
        description="찜한 포스터는 11:00부터 찜 목록에서 받을 수 있어요"
        image={mascotCouponEmpty}
        title="사용 가능한 쿠폰이 없어요"
      >
        <ActionButton onClick={() => navigate('/swipe')}>
          점심 포스터 보기
        </ActionButton>
      </EmptyState>
    );
  }

  return (
    <div className="relative px-page pt-4 pb-6">
      {toastMessage && (
        <div className="absolute inset-x-0 top-0 z-20 px-page pt-3">
          <FeedbackToast message={toastMessage} />
        </div>
      )}
      {coupons === null && <CouponLoadError onRetry={retry} />}
      {coupons === undefined && (
        <>
          {/* 응답이 빠르면 회색 틀이 잠깐 나왔다 사라져 번쩍이므로, 조금 기다린 뒤에만 보여준다 */}
          {showSkeleton && <CouponListSkeleton />}
          <p className="sr-only" role="status">
            쿠폰을 불러오는 중이에요
          </p>
        </>
      )}
      {coupons && (
        <ul className="flex flex-col gap-3">
          {coupons.map((coupon) => (
            <CouponCard
              coupon={coupon}
              // 쿠폰은 받은 날 사용 시간 안에만 쓸 수 있다
              info={
                <>
                  <Clock aria-hidden="true" className="size-3.5 shrink-0" />
                  <span className="truncate">
                    오늘 {formatUsableTime(coupon)} 사용
                  </span>
                </>
              }
              action={
                // 찜 카드의 쿠폰 받기와 같은 연한 주황 알약. 쿠폰이 여러 장이어도 화면이 주황으로 덮이지 않는다
                <button
                  aria-label={`${coupon.storeName} 쿠폰 QR 보기`}
                  className={`${ticketPillClassName} ${ticketPressableClassName} bg-surface-brand text-text-brand active:bg-brand-200`}
                  onClick={() => setSelectedCoupon(coupon)}
                  type="button"
                >
                  <QrCode aria-hidden="true" className="size-3.5" />
                  QR 보기
                </button>
              }
              key={coupon.memberCouponId}
              onRemove={() => {
                setSelectedCoupon(coupon);
                setIsConfirmingDelete(true);
              }}
            />
          ))}
        </ul>
      )}
      {/* 시트를 닫으면 QR 화면이 사라지면서 QR 갱신 타이머도 멈춘다 */}
      <BottomSheet
        isOpen={selectedCoupon !== null}
        onClose={closeSheet}
        title={isConfirmingDelete ? '쿠폰을 삭제할까요?' : '쿠폰 사용'}
      >
        {selectedCoupon && isConfirmingDelete && (
          <CouponDeleteConfirm
            coupon={selectedCoupon}
            errorMessage={deleteError}
            isDeleting={isDeleting}
            onCancel={closeSheet}
            onConfirm={handleDelete}
          />
        )}
        {/* 계산대에서 보여주는 화면이라 QR 시트에는 삭제를 두지 않는다 */}
        {selectedCoupon && !isConfirmingDelete && (
          // 쿠폰이 바뀌면 이전 쿠폰의 상태 확인과 QR을 이어 쓰지 않고 새로 시작한다
          <CouponQr
            coupon={selectedCoupon}
            key={selectedCoupon.memberCouponId}
          />
        )}
      </BottomSheet>
    </div>
  );
};

export default AvailableCoupons;
