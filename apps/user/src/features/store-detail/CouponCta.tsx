import { useNavigate } from 'react-router';

import ActionButton from '@user/components/ActionButton/ActionButton';
import FixedBottom from '@user/components/FixedBottom/FixedBottom';
import { formatCountdown } from '@user/features/wishlist/useOpenCountdown';

import type { CouponState } from './couponState';

interface CouponCtaProps {
  state: CouponState;
  isWished: boolean;
  dailyLimit: number;
  remainingMs: number;
  // 찜하거나 받는 요청을 기다리는 중
  isPending: boolean;
  onWish: () => void;
  onIssue: () => void;
}

// 하단 고정 버튼. 쿠폰 상태마다 지금 할 수 있는 일 하나만 보여준다
const CouponCta = ({
  dailyLimit,
  isPending,
  isWished,
  onIssue,
  onWish,
  remainingMs,
  state,
}: CouponCtaProps) => {
  const navigate = useNavigate();

  const renderNotice = () => {
    if (state === 'beforeOpenNotWished') {
      return '찜해두면 10:50에 오픈 알림을 보내드려요';
    }
    if (state === 'beforeOpenWished') {
      return (
        // 숫자 폭을 같게 해 1초마다 글자가 좌우로 흔들리지 않게 한다
        <>
          11:00 오픈까지{' '}
          <span className="font-bold text-text-brand tabular-nums">
            {formatCountdown(remainingMs)}
          </span>
        </>
      );
    }
    if (state === 'available') return '선착순이라 금방 마감될 수 있어요';
    return null;
  };

  const renderButton = () => {
    switch (state) {
      case 'beforeOpenNotWished':
        return (
          <ActionButton loading={isPending} onClick={onWish} size="large">
            찜해두기
          </ActionButton>
        );
      case 'beforeOpenWished':
        // 11:00이 되면 같은 자리가 받기로 바뀐다
        return (
          <ActionButton disabled size="large">
            11:00 오픈
          </ActionButton>
        );
      case 'available':
        // 찜하지 않았으면 찜과 받기를 한 번에 한다 (쿠폰은 찜한 캠페인만 받을 수 있다)
        return (
          <ActionButton loading={isPending} onClick={onIssue} size="large">
            {isWished ? '쿠폰 받기' : '찜하고 쿠폰 받기'}
          </ActionButton>
        );
      case 'issued':
        return (
          <ActionButton onClick={() => navigate('/coupons')} size="large">
            쿠폰함에서 보기
          </ActionButton>
        );
      case 'soldOut':
        return (
          <ActionButton disabled size="large">
            오늘 수량이 모두 소진됐어요
          </ActionButton>
        );
      case 'limitReached':
        return (
          <ActionButton disabled size="large">
            오늘 {dailyLimit}개를 모두 받았어요
          </ActionButton>
        );
    }
  };

  const notice = renderNotice();

  return (
    <FixedBottom>
      {notice && (
        <p className="mb-2 text-center text-caption-mobile text-text-secondary">
          {notice}
        </p>
      )}
      {renderButton()}
    </FixedBottom>
  );
};

export default CouponCta;
