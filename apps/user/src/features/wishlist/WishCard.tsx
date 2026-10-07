import { useNavigate } from 'react-router';
import { X } from 'lucide-react';

import type { CampaignIssueStatus } from '@user/api/coupon';
import type { WishItem } from '@user/api/wishlist';
import ActionButton from '@user/components/ActionButton/ActionButton';

import type { WishState } from './wishState';

interface WishCardProps {
  wish: WishItem;
  issueStatus: CampaignIssueStatus;
  state: WishState;
  dailyLimit: number;
  onIssue?: () => void;
  // 이 카드의 쿠폰을 받는 중인지
  isIssuing?: boolean;
  // 다른 카드의 쿠폰을 받는 중이라 잠시 누를 수 없는지
  isIssueBlocked?: boolean;
  onRemove?: () => void;
}

const formatPrice = (price: number) => `${price.toLocaleString('ko-KR')}원`;

// 찜 목록의 캠페인 한 줄. 카드, 사용 시간, 상태에 맞는 버튼으로 이루어진다
const WishCard = ({
  dailyLimit,
  isIssueBlocked = false,
  isIssuing = false,
  issueStatus,
  onIssue,
  onRemove,
  state,
  wish,
}: WishCardProps) => {
  const navigate = useNavigate();
  // 받은 쿠폰은 쿠폰함에서 관리하므로, 받았거나 받는 중인 카드는 찜에서 지울 수 없다
  const canRemove = onRemove && state !== 'issued' && !isIssuing;
  const remaining = `잔여 ${issueStatus.remainingCount}장`;

  const statusTextByState: Record<WishState, string> = {
    beforeOpen: `발급 전 · ${remaining}`,
    available: `발급 가능 · ${remaining}`,
    soldOut: '마감 · 수량 소진',
    limitReached: `발급 제한 · 오늘 ${dailyLimit}개 완료`,
    issued: '발급 완료 · 쿠폰함에서 확인',
  };

  return (
    // 버튼이 어느 가게 것인지 헷갈리지 않도록 사용 시간과 버튼까지 카드 하나에 담는다
    <li className="relative flex flex-col gap-3 rounded-xl border border-border-subtle bg-bg-surface p-4">
      {canRemove && (
        <button
          aria-label={`${wish.storeName} 찜 삭제`}
          className="absolute top-1 right-1 flex size-10 items-center justify-center rounded-full text-text-tertiary active:bg-surface-subtle focus-visible:outline-2 focus-visible:outline-action-primary"
          onClick={onRemove}
          type="button"
        >
          <X aria-hidden="true" className="size-4" />
        </button>
      )}
      <div className="flex items-center gap-3">
        <img
          alt=""
          className="size-18 shrink-0 rounded-lg bg-surface-subtle object-cover"
          height={72}
          src={wish.imageUrl}
          width={72}
        />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h3 className="truncate text-body-mobile font-bold text-text-primary">
            {wish.storeName}
          </h3>
          <p className="truncate text-caption-mobile text-text-secondary">
            {wish.offerTitle}
          </p>
          <p
            className={`truncate text-caption-mobile font-medium ${
              state === 'issued' ? 'text-text-brand' : 'text-text-secondary'
            }`}
          >
            {statusTextByState[state]}
          </p>
        </div>
        {/* 하루에 받을 수 있는 수가 정해져 있어, 카드끼리 가격을 쉽게 비교하도록 오른쪽 끝에 맞춘다 */}
        {/* 오른쪽 위는 삭제 버튼 자리라 아래쪽에 붙인다 */}
        <p className="flex shrink-0 flex-col items-end self-end">
          <del className="text-caption-mobile text-text-secondary">
            {formatPrice(wish.originalPrice)}
          </del>
          <strong className="text-body-mobile font-bold text-text-primary">
            {formatPrice(wish.salePrice)}
          </strong>
        </p>
      </div>
      <p className="text-caption-mobile text-text-secondary">
        사용 {issueStatus.usableFrom}–{issueStatus.usableTo} · 오늘
      </p>
      {/* 마감과 하루 한도는 상태 줄로 알 수 있어 버튼을 두지 않고, */}
      {/* 오픈 전에는 11:00에 같은 자리가 받기로 바뀌도록 자리를 미리 잡아 둔다 */}
      {state === 'beforeOpen' && (
        <ActionButton disabled>11:00 오픈</ActionButton>
      )}
      {/* 받는 동안 다시 누르지 못하게 막아 같은 요청이 두 번 가지 않게 한다 */}
      {state === 'available' && (
        <ActionButton
          disabled={isIssueBlocked && !isIssuing}
          loading={isIssuing}
          onClick={onIssue}
        >
          받기
        </ActionButton>
      )}
      {state === 'issued' && (
        <ActionButton onClick={() => navigate('/coupons')}>
          쿠폰함에서 보기
        </ActionButton>
      )}
    </li>
  );
};

export default WishCard;
