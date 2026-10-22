import type { StoreDetailCampaign } from '@user/api/store';
import Card from '@user/ui/Card/Card';
import PosterFrame from '@user/ui/PosterFrame/PosterFrame';
import { formatDiscount } from '@user/ui/storeFormat';
import { TicketDivider } from '@user/ui/Ticket/Ticket';

import type { CouponState } from './couponState';

interface CouponSectionProps {
  campaign: StoreDetailCampaign;
  state: CouponState;
  remainingCount: number;
  dailyLimit: number;
  storeName: string;
  // 포스터를 불러오는 중이면 undefined, 없으면 null
  posterHtml: string | null | undefined;
}

// 할인 대상. 메뉴 할인이면 그 메뉴 이름을 쓰고, 이름이 없는 예전 응답이면 '지정 메뉴'로 둔다
const getTargetLabel = ({
  discountTargetType,
  targetMenu,
}: StoreDetailCampaign) =>
  discountTargetType === 'ALL' ? '전 메뉴' : (targetMenu?.name ?? '지정 메뉴');

// 오늘의 쿠폰과 점주가 만든 포스터
const CouponSection = ({
  campaign,
  dailyLimit,
  posterHtml,
  remainingCount,
  state,
  storeName,
}: CouponSectionProps) => {
  const statusTextByState: Record<CouponState, string> = {
    beforeOpenNotWished: `잔여 ${remainingCount}장`,
    beforeOpenWished: `찜 완료 · 잔여 ${remainingCount}장`,
    available: `발급 가능 · 잔여 ${remainingCount}장`,
    soldOut: '마감 · 수량 소진',
    limitReached: `발급 제한 · 오늘 ${dailyLimit}개 완료`,
    closedNotWished: '오늘 발급 마감',
    closedWished: '오늘 발급 마감 · 찜 완료',
    issued: '발급 완료 · 쿠폰함에서 확인',
  };

  const isUnavailable =
    state === 'soldOut' ||
    state === 'limitReached' ||
    state === 'closedWished' ||
    state === 'closedNotWished';

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-h3-mobile font-bold text-text-primary">
        오늘의 쿠폰
      </h2>
      {/* 쿠폰함·찜 목록과 같은 쿠폰 모양(점선과 반원 홈)으로 두어, 같은 쿠폰이 화면마다 다른 물건처럼 보이지 않게 한다 */}
      {/* 받을 수 없는 상태(소진, 마감, 한도)는 위쪽을 흐리게 가라앉히고, 받을 수 있을 때만 아래 상태를 주황으로 둔다 */}
      <Card className="relative overflow-hidden">
        <div className={`px-4 py-3.5 ${isUnavailable ? 'opacity-60' : ''}`}>
          <p className="text-caption-mobile font-medium text-text-secondary">
            매일 11:00 선착순 발급
          </p>
          <p className="mt-1 text-h2-mobile font-bold text-text-primary">
            {getTargetLabel(campaign)} {formatDiscount(campaign)}
          </p>
        </div>
        <TicketDivider />
        <div className="flex items-center justify-between gap-3 px-4 py-2.5 text-caption-mobile">
          <span className="text-text-secondary">
            오늘 {campaign.usableStartTime} – {campaign.usableEndTime} 사용
          </span>
          <span
            className={`shrink-0 font-bold ${
              isUnavailable ? 'text-text-tertiary' : 'text-text-brand'
            }`}
          >
            {statusTextByState[state]}
          </span>
        </div>
      </Card>
      {posterHtml !== null && (
        // 포스터는 점주 화면과 같은 A4(210:297). 불러오는 동안에는 회색 배경이 보인다
        <div className="relative aspect-210/297 overflow-hidden rounded-xl bg-surface-subtle">
          {posterHtml && (
            <PosterFrame html={posterHtml} title={`${storeName} 포스터`} />
          )}
        </div>
      )}
    </section>
  );
};

export default CouponSection;
