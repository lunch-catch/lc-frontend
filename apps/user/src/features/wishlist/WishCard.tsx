import type { ReactNode } from 'react';
import { Link } from 'react-router';
import {
  ChevronRight,
  CircleCheck,
  Clock,
  LoaderCircle,
  Store,
  Ticket,
  X,
} from 'lucide-react';

import type { CampaignIssueStatus } from '@user/api/coupon';
import type { WishItem } from '@user/api/wishlist';
import Card from '@user/ui/Card/Card';
import {
  TicketDivider,
  ticketPillClassName,
  ticketPressableClassName,
} from '@user/ui/Ticket/Ticket';
import type { WishState } from '@user/ui/wishState';

import { isFinishedToday } from './finishedStates';
import { formatWishAmount, formatWishTarget } from './wishFormat';

// 카드가 보여줄 상태. unknown은 발급 상태를 불러오지 못해 받을 수 있는지 모르는 상태라 받기 버튼을 두지 않는다
// ended는 캠페인이 끝나 받을 수 없는 상태라 지우기만 할 수 있다
// used, expired, removed는 오늘 받은 쿠폰을 쓴 뒤, 사용 시간이 끝난 뒤, 쿠폰함에서 지운 뒤의 모습이다
export type WishCardState =
  WishState | 'unknown' | 'ended' | 'used' | 'expired' | 'removed';

interface WishCardProps {
  wish: WishItem;
  // 발급 상태를 불러오지 못했거나 끝난 캠페인이면 null이다
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

// 찜 목록의 캠페인 한 장
// 상태가 달라도 모든 카드를 같은 쿠폰 모양 틀(위: 가게와 할인, 점선, 아래: 정보 줄과 버튼 자리)로 둔다
// 상태는 버튼 자리 한 곳에서만 알려서, 카드 높이가 같고 목록을 위아래로 훑으며 비교하기 쉽다
// 버튼은 정보 줄 오른쪽 알약으로 두어 카드를 짧게 하고, 주황 알약은 받을 수 있을 때 하나뿐이라 받을 카드가 한눈에 보인다
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
  const isEnded = state === 'ended';
  // 찜을 지워도 받은 쿠폰은 쿠폰함에 그대로 남아, 받은 카드도 지울 수 있다 (내일 다시 받고 싶지 않을 때)
  // 받기 요청과 삭제 요청이 겹치지 않도록 받는 중에만 막는다
  const canRemove = onRemove && !isIssuing;
  // 끝난 캠페인과 오늘 노출 후보가 아닌 캠페인은 서버가 가게 이름을 비워 준다
  // 화면에는 내부 용어인 "캠페인" 대신 사용자가 아는 말(할인)을 쓴다
  const storeName = wish.storeName ?? (isEnded ? '할인이 끝난 가게' : '가게');
  // 잔여 수량은 아직 받을 수 있는 동안에만 의미가 있다
  const showsRemaining =
    issueStatus && (state === 'beforeOpen' || state === 'available');

  // 알약 버튼 공통 모양. 보이는 크기는 작게(32px) 두되, 11:00 선착순에도 잘 누르도록 위아래로 누르는 영역을 넓혀 44px로 맞춘다
  // 쿠폰함 카드와 같은 알약 모양을 쓴다
  const pillClassName = ticketPillClassName;
  const pressableClassName = ticketPressableClassName;

  // 오른쪽 알약. 받을 수 있으면 연한 주황, 받았으면 연한 초록, 받을 수 없으면 회색이라 상태를 색으로 바로 구별한다
  // 할인 글자의 주황과 부딪히지 않도록 진한 주황 대신 연한 주황으로 둔다
  // 받을 수 없는 상태는 누를 일이 없어 버튼이 아닌 글자로 둔다
  const renderAction = (): ReactNode => {
    const muted = (icon: ReactNode, label: string) => (
      <span
        className={`${pillClassName} bg-surface-subtle font-medium text-text-tertiary`}
      >
        {icon}
        {label}
      </span>
    );
    const clock = <Clock aria-hidden="true" className="size-3.5" />;

    switch (state) {
      case 'available':
        // 받는 동안 다시 누르지 못하게 막아 같은 요청이 두 번 가지 않게 한다
        // 누른 카드만 연하게 하고 스피너를 돌린다. 다른 카드의 버튼도 같이 연해지면 전부 처리 중처럼 보여서,
        // 다른 카드는 평소 모양 그대로 두고 눌러도 아무 일이 없게만 막는다 (발급 요청은 한 번에 하나만 간다)
        return (
          <button
            aria-busy={isIssuing}
            aria-disabled={isIssueBlocked && !isIssuing ? true : undefined}
            aria-label={`${storeName} 쿠폰 받기`}
            className={`${pillClassName} ${pressableClassName} bg-surface-brand text-text-brand active:bg-brand-200`}
            disabled={isIssuing}
            onClick={isIssueBlocked ? undefined : onIssue}
            type="button"
          >
            {isIssuing ? (
              <LoaderCircle
                aria-hidden="true"
                className="size-3.5 animate-spin motion-reduce:animate-none"
              />
            ) : (
              <Ticket aria-hidden="true" className="size-3.5" />
            )}
            쿠폰 받기
          </button>
        );
      case 'issued':
        return (
          <Link
            aria-label={`${storeName} 받은 쿠폰, 쿠폰함에서 보기`}
            className={`${pillClassName} ${pressableClassName} bg-status-success-bg text-status-success-fg active:opacity-80`}
            to="/coupons"
          >
            <CircleCheck aria-hidden="true" className="size-3.5" />
            받았어요
            <ChevronRight aria-hidden="true" className="-mr-1 size-3.5" />
          </Link>
        );
      // 받은 쿠폰이 쿠폰함에서 어디 있는지 알려 준다. 쓰거나 만료된 쿠폰은 사용 내역 탭에 있다
      case 'used':
      case 'expired':
        return (
          <Link
            aria-label={`${storeName} ${state === 'used' ? '사용 완료' : '만료'}된 쿠폰, 사용 내역에서 보기`}
            className={`${pillClassName} ${pressableClassName} bg-surface-subtle text-text-tertiary active:opacity-80`}
            to="/coupons/history"
          >
            {state === 'used' ? '사용 완료' : '만료'}
            <ChevronRight aria-hidden="true" className="-mr-1 size-3.5" />
          </Link>
        );
      // 사용자가 쿠폰함에서 지운 쿠폰이라 이동할 곳이 없다
      case 'removed':
        return muted(null, '삭제함');
      // 11:00에 같은 자리가 쿠폰 받기로 바뀐다
      case 'beforeOpen':
        return muted(clock, '11:00 오픈');
      // 14:00 마감 뒤에는 오늘 받을 수 없어, 찜해 둔 쿠폰을 다음 오픈에 받는다고 알려준다
      case 'closed':
        return muted(clock, '내일 11:00 오픈');
      case 'soldOut':
        return muted(null, '수량 소진');
      // 수량이 다 나간 게 아니라 오늘 열린 이벤트가 없는 것이라 소진과 구분한다
      case 'noEvent':
        return muted(null, '오늘 쿠폰 없음');
      case 'limitReached':
        return muted(null, `오늘 ${dailyLimit}개 완료`);
      case 'ended':
        return muted(null, '종료됨');
      case 'unknown':
        return null;
    }
  };

  // 정보 줄. 사용 시간과 잔여 수량, 끝난 캠페인은 언제 사라지는지
  // 좁은 화면에서 알약과 부딪히면 정보 줄 쪽이 말줄임으로 줄어든다
  const renderInfo = (): ReactNode => {
    if (isEnded) {
      return <span className="truncate">3일 뒤 목록에서 사라져요</span>;
    }
    if (!issueStatus) return null;
    // 오늘 이벤트가 없으면 사용 시간도 없다 (서버가 빈 값을 준다)
    // 다른 카드가 사용 시간을 보여주는 자리라, 비워 두지 않고 없다고 알려 쿠폰 모양을 맞춘다
    if (!issueStatus.usableFrom) {
      return (
        <>
          <Clock aria-hidden="true" className="size-3.5 shrink-0" />
          <span className="truncate">사용 시간 없음</span>
        </>
      );
    }
    return (
      <>
        <Clock aria-hidden="true" className="size-3.5 shrink-0" />
        {/* 옆 알약의 11:00 오픈과 헷갈리지 않게 쿠폰 사용 시간이라고 밝힌다 */}
        <span className="shrink-0">
          사용 {issueStatus.usableFrom}–{issueStatus.usableTo}
        </span>
        {showsRemaining && (
          <>
            <span
              aria-hidden="true"
              className="h-3 w-px shrink-0 bg-border-subtle"
            />
            <span className="truncate">
              잔여 {issueStatus.remainingCount}장
            </span>
          </>
        )}
      </>
    );
  };

  // 오늘 끝난 카드(쿠폰 없음, 사용 완료, 만료, 삭제함)도 같은 쿠폰 모양을 유지하고, 위쪽만 흐리게 해 끝났다는 걸 보여준다
  const isDimmed = isEnded || isFinishedToday(state);
  const topContent = (
    <>
      {wish.imageUrl ? (
        <img
          alt=""
          className="size-14 shrink-0 rounded-lg bg-surface-subtle object-cover"
          height={56}
          src={wish.imageUrl}
          width={56}
        />
      ) : (
        // 가게가 대표 사진을 올리지 않았으면 회색 바탕에 가게 아이콘을 둔다
        <div
          aria-hidden="true"
          className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-surface-subtle text-text-tertiary"
        >
          <Store className="size-6" />
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col items-start gap-1.5">
        <div className="flex max-w-full min-w-0 items-center gap-1.5">
          {/* 찜 목록은 할인을 비교하는 화면이라, 이름은 한 단계 작은 보통 굵기로 두어 주황 할인이 먼저 눈에 들어오게 한다 */}
          <h3 className="min-w-0 truncate text-body-sm-mobile font-medium text-text-primary">
            {storeName}
          </h3>
        </div>
        {wish.discount ? (
          // 하루에 받을 수 있는 수가 정해져 있어, 카드끼리 할인을 쉽게 비교하도록 크게 둔다
          // 할인 대상은 같은 줄 옆에 두어 카드가 한 줄 덜 길어지게 한다
          <div className="flex max-w-full min-w-0 items-center gap-1.5">
            {/* 바로 아래 받기 버튼과 같은 연한 주황 칸이면 할인도 눌리는 것처럼 보여, 바탕 없이 큰 주황 글자로만 둔다 */}
            <strong className="shrink-0 text-h3-mobile font-bold text-text-brand">
              {formatWishAmount(wish.discount)}
            </strong>
            <span className="min-w-0 truncate text-caption-mobile text-text-secondary">
              {formatWishTarget(wish.discount)}
            </span>
          </div>
        ) : (
          isEnded && (
            <p className="max-w-full truncate text-caption-mobile text-text-secondary">
              할인이 끝나 받을 수 없어요
            </p>
          )
        )}
      </div>
    </>
  );
  const topClassName = `flex items-center gap-3 p-3 pr-10 ${isDimmed ? 'opacity-60' : ''}`;
  const topArea = isEnded ? (
    <div className={topClassName}>{topContent}</div>
  ) : (
    <Link
      className={`${topClassName} active:bg-surface-subtle focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-action-primary`}
      to={`/stores/${wish.storeId}`}
    >
      {topContent}
    </Link>
  );
  const action = renderAction();
  const info = renderInfo();

  return (
    // 쿠폰을 모아 둔 곳이라 쿠폰 모양(양옆 반원 홈과 점선)으로 둔다
    // 홈이 카드 밖으로 나간 반쪽을 가리도록 카드를 넘치지 않게 자른다
    <Card as="li" className="relative overflow-hidden">
      {/* 흐리게 한 내용(opacity)이 새 쌓임 순서를 만들어 버튼을 덮지 않도록 z-10으로 위에 둔다 */}
      {canRemove && (
        <button
          aria-label={`${storeName} 찜 삭제`}
          className="absolute top-1 right-1 z-10 flex size-10 items-center justify-center rounded-full text-text-tertiary active:bg-surface-subtle focus-visible:outline-2 focus-visible:outline-action-primary"
          onClick={onRemove}
          type="button"
        >
          <X aria-hidden="true" className="size-4" />
        </button>
      )}
      {/* 끝난 캠페인과 오늘 끝난 카드는 위쪽 내용만 흐리게 해서 같은 틀 안에서 끝났다는 걸 보여준다 */}
      {/* 사진·이름·할인을 누르면 가게 상세로 간다. 삭제와 쿠폰 알약은 따로 눌린다. 끝난 캠페인은 가게 정보가 비어 이동하지 않는다 */}
      {topArea}

      {/* 발급 상태를 모르면 목록 맨 위 안내가 이유를 말해 주므로 아래쪽을 두지 않는다 */}
      {action && (
        <>
          {/* 쿠폰을 뜯는 자리처럼 점선과 양옆 반원 홈을 둔다 (쿠폰함 카드와 같은 모양) */}
          <TicketDivider />
          {/* 정보 줄 오른쪽에 알약 버튼을 두어 버튼 줄 하나를 줄인다 */}
          <div className="flex items-center justify-between gap-2 px-3 py-2.5">
            <p className="flex min-w-0 items-center gap-1.5 text-caption-mobile text-text-secondary">
              {info}
            </p>
            {action}
          </div>
        </>
      )}
    </Card>
  );
};

export default WishCard;
