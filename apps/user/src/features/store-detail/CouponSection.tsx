import type { StoreDetailCampaign } from '@user/api/store';
import { formatDiscount } from '@user/features/explore/storeFormat';

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

const TARGET_LABELS: Record<StoreDetailCampaign['discountTargetType'], string> =
  {
    ALL: '전 메뉴',
    MENU: '지정 메뉴',
  };

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
    issued: '발급 완료 · 쿠폰함에서 확인',
  };

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-h3-mobile font-bold text-text-primary">
        오늘의 쿠폰
      </h2>
      <div className="rounded-xl border border-dashed border-action-primary/40 bg-surface-brand p-4">
        <p className="text-caption-mobile font-medium text-text-brand">
          매일 11:00 선착순 발급
        </p>
        <p className="mt-1 text-h2-mobile font-bold text-text-primary">
          {TARGET_LABELS[campaign.discountTargetType]}{' '}
          {formatDiscount(campaign)}
        </p>
        <div className="mt-3 flex items-center justify-between gap-3 border-t border-dashed border-action-primary/30 pt-3 text-caption-mobile">
          <span className="text-text-secondary">
            오늘 {campaign.usableStartTime} – {campaign.usableEndTime} 사용
          </span>
          <span
            className={`shrink-0 font-bold ${
              state === 'soldOut' || state === 'limitReached'
                ? 'text-text-tertiary'
                : 'text-text-brand'
            }`}
          >
            {statusTextByState[state]}
          </span>
        </div>
      </div>
      {posterHtml !== null && (
        // 포스터는 점주 화면과 같은 3:4. 불러오는 동안에는 회색 배경이 보인다
        <div className="relative aspect-3/4 overflow-hidden rounded-xl bg-surface-subtle">
          {posterHtml && (
            <iframe
              className="pointer-events-none absolute inset-0 size-full border-0"
              // 포스터 안의 스크립트, 폼, 링크 이동을 모두 막는다
              sandbox=""
              srcDoc={posterHtml}
              tabIndex={-1}
              title={`${storeName} 포스터`}
            />
          )}
        </div>
      )}
    </section>
  );
};

export default CouponSection;
