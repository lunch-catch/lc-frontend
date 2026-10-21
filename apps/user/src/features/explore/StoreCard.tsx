import { Link } from 'react-router';
import { Store } from 'lucide-react';

import { BUSINESS_CATEGORY_LABELS, type StoreListItem } from '@user/api/store';
import { cardClassName } from '@user/ui/Card/Card';
import {
  formatDiscount,
  formatDiscountTarget,
  formatWalkTime,
} from '@user/ui/storeFormat';

interface StoreCardProps {
  store: StoreListItem;
}

// 탐색 목록의 가게 한 곳 (Figma Card/Restaurant)
const StoreCard = ({ store }: StoreCardProps) => {
  const meta = [
    BUSINESS_CATEGORY_LABELS[store.businessCategory],
    store.distanceMeters !== null && formatWalkTime(store.distanceMeters),
  ]
    .filter(Boolean)
    .join(' · ');
  const target =
    store.activeCampaign && formatDiscountTarget(store.activeCampaign);

  return (
    <li>
      <Link
        className={`flex items-center gap-3 p-3 active:bg-surface-subtle focus-visible:outline-2 focus-visible:outline-action-primary ${cardClassName}`}
        to={`/stores/${store.storeId}`}
      >
        {store.thumbnailUrl ? (
          <img
            alt=""
            className="size-14 shrink-0 rounded-lg bg-surface-subtle object-cover"
            height={72}
            loading="lazy"
            src={store.thumbnailUrl}
            width={72}
          />
        ) : (
          // 사진이 없는 가게는 회색 바탕에 가게 아이콘을 둔다
          <div
            aria-hidden="true"
            className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-surface-subtle text-text-tertiary"
          >
            <Store className="size-6" />
          </div>
        )}
        {/* 가게 이름과 할인이 같은 크기·굵기면 둘 다 커 보여서, 찜 카드처럼 이름은 작게 낮추고 할인만 주황으로 띄운다 */}
        <div className="flex min-w-0 flex-col gap-0.5">
          <p className="truncate text-body-sm-mobile font-medium text-text-primary">
            {store.name}
          </p>
          <p className="truncate text-caption-mobile text-text-secondary">
            {meta}
          </p>
          {store.activeCampaign ? (
            // 무엇을 할인하는지는 같은 줄 옆에 두어 카드가 한 줄 덜 길어지게 한다 (찜 카드와 같은 모양)
            <p className="mt-0.5 flex min-w-0 items-baseline gap-1.5">
              <strong className="shrink-0 text-body-mobile font-bold text-text-brand">
                {formatDiscount(store.activeCampaign)}
              </strong>
              {target && (
                <span className="min-w-0 truncate text-caption-mobile text-text-secondary">
                  {target}
                </span>
              )}
            </p>
          ) : (
            <p className="mt-0.5 text-caption-mobile text-text-tertiary">
              진행 중인 쿠폰 없음
            </p>
          )}
        </div>
      </Link>
    </li>
  );
};

export default StoreCard;
