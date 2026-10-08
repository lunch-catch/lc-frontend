import { Link } from 'react-router';
import { Store } from 'lucide-react';

import { BUSINESS_CATEGORY_LABELS, type StoreListItem } from '@user/api/store';

import { formatDiscount, formatWalkTime } from './storeFormat';

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

  return (
    <li>
      <Link
        className="flex items-center gap-3 rounded-xl border border-border-subtle bg-bg-surface p-3 active:bg-surface-subtle focus-visible:outline-2 focus-visible:outline-action-primary"
        to={`/stores/${store.storeId}`}
      >
        {store.thumbnailUrl ? (
          <img
            alt=""
            className="size-18 shrink-0 rounded-lg bg-surface-subtle object-cover"
            height={72}
            loading="lazy"
            src={store.thumbnailUrl}
            width={72}
          />
        ) : (
          // 사진이 없는 가게는 회색 바탕에 가게 아이콘을 둔다
          <div
            aria-hidden="true"
            className="flex size-18 shrink-0 items-center justify-center rounded-lg bg-surface-subtle text-text-tertiary"
          >
            <Store className="size-6" />
          </div>
        )}
        <div className="flex min-w-0 flex-col gap-1">
          <p className="truncate text-body-mobile font-bold text-text-primary">
            {store.name}
          </p>
          <p className="truncate text-caption-mobile text-text-secondary">
            {meta}
          </p>
          {store.activeCampaign ? (
            <p className="text-body-mobile font-bold text-text-primary">
              {formatDiscount(store.activeCampaign)}
            </p>
          ) : (
            <p className="text-caption-mobile text-text-tertiary">
              진행 중인 쿠폰 없음
            </p>
          )}
        </div>
      </Link>
    </li>
  );
};

export default StoreCard;
