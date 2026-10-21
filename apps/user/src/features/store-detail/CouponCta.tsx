import { useNavigate } from 'react-router';

import { formatCountdown } from '@user/hooks/useOpenCountdown';
import ActionButton from '@user/ui/ActionButton/ActionButton';
import FeedbackToast, {
  type FeedbackToastProps,
} from '@user/ui/FeedbackToast/FeedbackToast';
import FixedBottom from '@user/ui/FixedBottom/FixedBottom';

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
  // 하단 버튼 바로 위에 띄울 안내
  toast: FeedbackToastProps | null;
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
  toast,
}: CouponCtaProps) => {
  const navigate = useNavigate();

  const renderNotice = () => {
    if (state === 'beforeOpenNotWished') {
      // 알림 기능을 빼서 알림 대신 받는 때와 곳을 알려준다
      return '찜해두면 11:00부터 찜 목록에서 쿠폰을 받을 수 있어요';
    }
    if (state === 'beforeOpenWished') {
      return (
        // 숫자 폭을 같게 해 1초마다 글자가 좌우로 흔들리지 않게 한다
        <>
          {/* 바로 아래 버튼이 '쿠폰 11:00 오픈'이라 여기서는 '쿠폰'을 되풀이하지 않는다 */}
          오픈까지{' '}
          <span className="font-bold text-text-brand tabular-nums">
            {formatCountdown(remainingMs)}
          </span>
        </>
      );
    }
    if (state === 'available') return '선착순이라 금방 마감될 수 있어요';
    // 14:00 마감 뒤에도 찜할 수 있어, 지금 찜하면 언제 받는지 알려준다
    if (state === 'closedNotWished') {
      return '오늘 발급은 끝났어요 · 찜해두면 내일 11:00부터 받을 수 있어요';
    }
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
            쿠폰 11:00 오픈
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
      case 'closedNotWished':
        return (
          <ActionButton loading={isPending} onClick={onWish} size="large">
            찜해두기
          </ActionButton>
        );
      case 'closedWished':
        // 찜해 둔 쿠폰은 다음 오픈에 받는다
        return (
          <ActionButton disabled size="large">
            쿠폰 내일 11:00 오픈
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
      {/* 안내 문구가 있든 없든 하단 영역 바로 위에 붙어서 버튼과 간격이 일정하다 */}
      {toast && (
        <div className="absolute inset-x-0 bottom-full z-30 px-page pb-2">
          <FeedbackToast {...toast} />
        </div>
      )}
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
