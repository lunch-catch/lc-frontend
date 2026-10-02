import { useNavigate } from 'react-router';

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
}

const formatPrice = (price: number) => `${price.toLocaleString('ko-KR')}원`;

// 찜 목록의 캠페인 한 줄. 카드, 사용 시간, 상태에 맞는 버튼으로 이루어진다
const WishCard = ({
  dailyLimit,
  issueStatus,
  onIssue,
  state,
  wish,
}: WishCardProps) => {
  const navigate = useNavigate();
  const remaining = `잔여 ${issueStatus.remainingCount}장`;

  const statusTextByState: Record<WishState, string> = {
    beforeOpen: `발급 전 · ${remaining}`,
    available: `발급 가능 · ${remaining}`,
    soldOut: '마감 · 수량 소진',
    limitReached: `발급 제한 · 오늘 ${dailyLimit}개 완료`,
    issued: '발급 완료 · 쿠폰함에서 확인',
  };

  const disabledLabelByState: Partial<Record<WishState, string>> = {
    beforeOpen: '11:00 오픈',
    soldOut: '마감',
    limitReached: `오늘 발급 한도 ${dailyLimit}개 완료`,
  };
  const disabledLabel = disabledLabelByState[state];

  return (
    // 버튼이 어느 가게 것인지 헷갈리지 않도록 사용 시간과 버튼까지 카드 하나에 담는다
    <li className="flex flex-col gap-3 rounded-xl border border-border-subtle bg-bg-surface p-4">
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
        <p className="flex shrink-0 flex-col items-end">
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
      {disabledLabel && <ActionButton disabled>{disabledLabel}</ActionButton>}
      {state === 'available' && (
        <ActionButton onClick={onIssue}>받기</ActionButton>
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
