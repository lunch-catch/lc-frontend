import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { BottomSheet } from '@repo/ui';
import { QrCode } from 'lucide-react';

import { ApiError } from '@user/api/client';
import { getNow } from '@user/api/clock';
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
import CouponListSkeleton from './CouponListSkeleton';
import CouponLoadError from './CouponLoadError';
import CouponQr from './CouponQr';
import UsableTimeInfo from './UsableTimeInfo';

const TOAST_DURATION_MS = 2500;
const NOW_TICK_MS = 30_000;

// 지금 쓸 수 있는 쿠폰을 위로, 그중 곧 끝나는 것부터 둔다. 사용 시간 전 쿠폰은 아래에 먼저 열리는 것부터 둔다
// 계산대 앞에서 화면을 열면 맨 위 쿠폰의 QR 보기를 바로 누르면 되게 한다
const sortByUsable = (coupons: Coupon[], now: number) =>
  [...coupons].sort((a, b) => {
    const aWaiting = now < Date.parse(a.usableStartTime);
    const bWaiting = now < Date.parse(b.usableStartTime);
    if (aWaiting !== bWaiting) return aWaiting ? 1 : -1;
    return aWaiting
      ? Date.parse(a.usableStartTime) - Date.parse(b.usableStartTime)
      : Date.parse(a.usableEndTime) - Date.parse(b.usableEndTime);
  });

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
  // 사용 시간이 되면 버튼 색과 순서를 바꾸려고 30초마다 시각을 다시 읽는다
  const [now, setNow] = useState(getNow);

  useEffect(() => {
    const timer = setInterval(() => setNow(getNow()), NOW_TICK_MS);
    return () => clearInterval(timer);
  }, []);

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
          {sortByUsable(coupons, now).map((coupon) => {
            const isBeforeUse = now < Date.parse(coupon.usableStartTime);
            return (
              <CouponCard
                coupon={coupon}
                // 쿠폰은 받은 날 사용 시간 안에만 쓸 수 있다
                info={
                  <UsableTimeInfo
                    usableEndTime={coupon.usableEndTime}
                    usableStartTime={coupon.usableStartTime}
                  />
                }
                action={
                  // 지금 쓸 수 있는 쿠폰은 가게 계산대에서 바로 눌러야 해서 주황으로 채운다
                  // 사용 시간 전 쿠폰은 연한 주황으로 두어 아직 때가 아니라는 걸 보여준다. 누르면 언제부터 쓸 수 있는지 카운트다운이 열린다
                  // 회색으로 막으면 고장 난 것처럼 보이고 남은 시간도 볼 수 없어 누를 수 있게 둔다
                  <button
                    aria-label={`${coupon.storeName} 쿠폰 QR 보기`}
                    className={`${ticketPillClassName} ${ticketPressableClassName} ${
                      isBeforeUse
                        ? 'bg-surface-brand text-text-brand active:bg-brand-200'
                        : 'bg-action-primary text-text-inverse active:bg-action-primary-hover'
                    }`}
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
            );
          })}
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
            onClose={closeSheet}
          />
        )}
      </BottomSheet>
    </div>
  );
};

export default AvailableCoupons;
