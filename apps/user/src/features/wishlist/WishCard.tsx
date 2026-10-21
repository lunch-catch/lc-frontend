import { useNavigate } from 'react-router';
import { StatusBadge } from '@repo/ui';
import { Check, Store, X } from 'lucide-react';

import type { CampaignIssueStatus } from '@user/api/coupon';
import type { WishItem } from '@user/api/wishlist';
import ActionButton from '@user/ui/ActionButton/ActionButton';
import Card from '@user/ui/Card/Card';
import type { WishState } from '@user/ui/wishState';

import { formatWishAmount, formatWishTarget } from './wishFormat';

// 카드가 보여줄 상태. unknown은 발급 상태를 불러오지 못해 받을 수 있는지 모르는 상태라 받기 버튼을 두지 않는다
// ended는 캠페인이 끝나 받을 수 없는 상태라 지우기만 할 수 있다
export type WishCardState = WishState | 'unknown' | 'ended';

interface WishCardProps {
  wish: WishItem;
  // 발급 상태를 불러오지 못했으면 null이다. 이때 state는 unknown이다
  issueStatus: CampaignIssueStatus | null;
  state: WishCardState;
  dailyLimit: number;
  onIssue?: () => void;
  // 이 카드의 쿠폰을 받는 중인지
  isIssuing?: boolean;
  // 다른 카드의 쿠폰을 받는 중이라 잠시 누를 수 없는지
  isIssueBlocked?: boolean;
  onRemove?: () => void;
}

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
  const remaining = `잔여 ${issueStatus?.remainingCount ?? 0}장`;
  // 오늘 노출 후보가 아니면 서버가 가게 이름을 비워 준다. 그런 캠페인은 발급 상태도 없어 보통 목록에 나오지 않는다
  const storeName = wish.storeName ?? '가게';

  const statusTextByState: Record<WishState, string> = {
    beforeOpen: `발급 전 · ${remaining}`,
    available: `발급 가능 · ${remaining}`,
    soldOut: '마감 · 수량 소진',
    limitReached: `발급 제한 · 오늘 ${dailyLimit}개 완료`,
    issued: '받았어요',
  };

  // 끝난 캠페인은 서버가 가게 이름, 사진, 할인을 비워 보내서 같은 카드 모양을 흐리게 두고 종료만 알린다
  // 받을 수 없어 받기 버튼은 없고, 서버가 지우기 전에 직접 지울 수 있게 삭제만 남긴다
  if (state === 'ended') {
    const endedName = wish.storeName ?? '끝난 캠페인';

    return (
      <Card as="li" className="relative flex flex-col gap-3 p-4">
        {/* 흐리게 한 내용(opacity)이 새 쌓임 순서를 만들어 버튼을 덮지 않도록 z-10으로 위에 둔다 */}
        {onRemove && (
          <button
            aria-label={`${endedName} 찜 삭제`}
            className="absolute top-1 right-1 z-10 flex size-10 items-center justify-center rounded-full text-text-tertiary active:bg-surface-subtle focus-visible:outline-2 focus-visible:outline-action-primary"
            onClick={onRemove}
            type="button"
          >
            <X aria-hidden="true" className="size-4" />
          </button>
        )}
        {/* 삭제 버튼은 흐리게 하지 않도록 내용만 흐리게 한다 */}
        <div className="flex items-center gap-3 opacity-60">
          <div
            aria-hidden="true"
            className="flex size-18 shrink-0 items-center justify-center rounded-lg bg-surface-subtle text-text-tertiary"
          >
            <Store className="size-6" />
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-1 pr-8">
            <div className="flex min-w-0 items-center gap-1.5">
              <h3 className="truncate text-body-mobile font-bold text-text-primary">
                {endedName}
              </h3>
              <StatusBadge className="shrink-0" variant="neutral">
                종료
              </StatusBadge>
            </div>
            <p className="text-caption-mobile font-medium text-text-secondary">
              캠페인이 끝나 쿠폰을 받을 수 없어요
            </p>
            <p className="text-caption-mobile text-text-tertiary">
              끝난 날부터 3일 뒤 목록에서 사라져요
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    // 버튼이 어느 가게 것인지 헷갈리지 않도록 사용 시간과 버튼까지 카드 하나에 담는다
    <Card as="li" className="relative flex flex-col gap-3 p-4">
      {canRemove && (
        <button
          aria-label={`${storeName} 찜 삭제`}
          className="absolute top-1 right-1 flex size-10 items-center justify-center rounded-full text-text-tertiary active:bg-surface-subtle focus-visible:outline-2 focus-visible:outline-action-primary"
          onClick={onRemove}
          type="button"
        >
          <X aria-hidden="true" className="size-4" />
        </button>
      )}
      <div className="flex items-center gap-3">
        {wish.imageUrl ? (
          <img
            alt=""
            className="size-18 shrink-0 rounded-lg bg-surface-subtle object-cover"
            height={72}
            src={wish.imageUrl}
            width={72}
          />
        ) : (
          // 가게가 대표 사진을 올리지 않았으면 회색 바탕에 가게 아이콘을 둔다
          <div
            aria-hidden="true"
            className="flex size-18 shrink-0 items-center justify-center rounded-lg bg-surface-subtle text-text-tertiary"
          >
            <Store className="size-6" />
          </div>
        )}
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h3 className="truncate text-body-mobile font-bold text-text-primary">
            {storeName}
          </h3>
          {wish.discount && (
            <p className="truncate text-caption-mobile text-text-secondary">
              {formatWishTarget(wish.discount)}
            </p>
          )}
          {/* 받은 카드는 자리를 지키므로, 받았다는 걸 초록 체크로 분명하게 보여준다 */}
          {/* 발급 상태를 모르면 목록 맨 위 안내가 이유를 말해 주므로 카드마다 반복하지 않는다 */}
          {state !== 'unknown' && (
            <p
              className={`flex items-center gap-1 truncate text-caption-mobile font-medium ${
                state === 'issued'
                  ? 'text-status-success-fg'
                  : 'text-text-secondary'
              }`}
            >
              {state === 'issued' && (
                <Check
                  aria-hidden="true"
                  className="size-3.5 shrink-0"
                  strokeWidth={3}
                />
              )}
              {statusTextByState[state]}
            </p>
          )}
        </div>
        {/* 하루에 받을 수 있는 수가 정해져 있어, 카드끼리 할인을 쉽게 비교하도록 오른쪽 끝에 맞춘다 */}
        {/* 오른쪽 위는 삭제 버튼 자리라 아래쪽에 붙인다 */}
        {wish.discount && (
          <strong className="shrink-0 self-end text-body-mobile font-bold text-text-brand">
            {formatWishAmount(wish.discount)}
          </strong>
        )}
      </div>
      {/* 사용 시간은 발급 상태에서 온다. 불러오지 못했으면 틀린 시간 대신 줄을 뺀다 */}
      {issueStatus && (
        <p className="text-caption-mobile text-text-secondary">
          사용 {issueStatus.usableFrom}–{issueStatus.usableTo} · 오늘
        </p>
      )}
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
          // 오픈 뒤에는 모든 카드에 받기가 생겨 진한 주황이면 목록이 주황으로 덮인다
          variant="soft"
        >
          받기
        </ActionButton>
      )}
      {state === 'issued' && (
        <ActionButton onClick={() => navigate('/coupons')} variant="ghost">
          쿠폰함에서 보기
        </ActionButton>
      )}
    </Card>
  );
};

export default WishCard;
