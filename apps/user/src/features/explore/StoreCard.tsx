import { useState } from 'react';
import { Link } from 'react-router';
import { Store, TicketSlash } from 'lucide-react';

import { BUSINESS_CATEGORY_LABELS, type StoreListItem } from '@user/api/store';
import { cardClassName } from '@user/ui/Card/Card';
import { formatDiscountTarget, formatWalkTime } from '@user/ui/storeFormat';

interface StoreCardProps {
  store: StoreListItem;
}

// 탐색 목록의 가게 한 곳 (Figma Card/Restaurant)
// 쿠폰이 진행 중인 가게는 오른쪽에 점선으로 나눈 할인 칸(쿠폰의 떼어내는 부분)을 두어, 목록을 훑으며 할인을 한눈에 비교하게 한다
// 쿠폰이 없는 가게도 같은 모양의 칸을 회색으로 두어 목록이 같은 틀로 이어지게 하되, 쿠폰 가게보다 눈에 덜 띄게 한다
// 반원 홈과 점선은 모양만 같을 뿐이고, 쿠폰은 찜한 뒤 찜 목록에서 받으므로 카드에는 받기 버튼을 두지 않는다
const StoreCard = ({ store }: StoreCardProps) => {
  const meta = [
    BUSINESS_CATEGORY_LABELS[store.businessCategory],
    store.distanceMeters !== null && formatWalkTime(store.distanceMeters),
  ]
    .filter(Boolean)
    .join(' · ');
  const campaign = store.activeCampaign;
  const target = campaign && formatDiscountTarget(campaign);
  const [hasImageError, setHasImageError] = useState(false);

  // 할인 칸에 크게 보여줄 값. 단위(할인)는 아래에 작게 따로 둔다
  const discountValue = campaign
    ? campaign.discountType === 'PERCENT'
      ? `${campaign.discountValue}%`
      : `${campaign.discountValue.toLocaleString('ko-KR')}원`
    : null;

  const thumbnail =
    store.thumbnailUrl && !hasImageError ? (
      <img
        alt=""
        className="size-14 shrink-0 rounded-lg bg-surface-subtle object-cover"
        height={72}
        loading="lazy"
        onError={() => setHasImageError(true)}
        src={store.thumbnailUrl}
        width={72}
      />
    ) : (
      // 사진이 없거나 열리지 않는 가게는 회색 바탕에 가게 아이콘을 둔다 (깨진 그림 표시 대신)
      <div
        aria-hidden="true"
        className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-surface-subtle text-text-tertiary"
      >
        <Store className="size-6" />
      </div>
    );

  return (
    <li>
      <Link
        className={`flex items-stretch overflow-hidden active:bg-surface-subtle focus-visible:outline-2 focus-visible:outline-action-primary ${cardClassName}`}
        to={`/stores/${store.storeId}`}
      >
        <div className="flex min-w-0 flex-1 items-center gap-3 p-3">
          {thumbnail}
          <div className="flex min-w-0 flex-col gap-0.5">
            <p className="truncate text-body-sm-mobile font-medium text-text-primary">
              {store.name}
            </p>
            <p className="truncate text-caption-mobile text-text-secondary">
              {meta}
            </p>
            {target && (
              <p className="truncate text-caption-mobile text-text-secondary">
                {target}
              </p>
            )}
          </div>
        </div>
        <div
          className={`relative flex w-21 shrink-0 flex-col items-center justify-center border-l border-dashed px-2 ${
            discountValue
              ? 'border-brand-200 bg-surface-brand'
              : 'border-border-subtle bg-surface-subtle/60'
          }`}
        >
          {/* 점선 위아래에 반원 홈을 두어 쿠폰의 떼어내는 부분처럼 보이게 한다. 카드 밖으로 나간 반쪽은 카드가 잘라낸다 */}
          <span
            aria-hidden="true"
            className="absolute -top-2 -left-2 size-4 rounded-full border border-border-subtle bg-bg-page"
          />
          <span
            aria-hidden="true"
            className="absolute -bottom-2 -left-2 size-4 rounded-full border border-border-subtle bg-bg-page"
          />
          {discountValue ? (
            <>
              <strong className="text-body-mobile leading-tight font-bold text-text-brand">
                {discountValue}
              </strong>
              <span className="mt-0.5 text-caption-mobile font-medium text-text-brand/80">
                할인
              </span>
            </>
          ) : (
            <>
              <TicketSlash
                aria-hidden="true"
                className="size-5 text-text-tertiary"
              />
              <span className="mt-1 text-caption-mobile font-medium text-text-tertiary">
                쿠폰 없음
              </span>
            </>
          )}
        </div>
      </Link>
    </li>
  );
};

export default StoreCard;
