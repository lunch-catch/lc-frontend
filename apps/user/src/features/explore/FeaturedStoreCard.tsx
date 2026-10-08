import { Link } from 'react-router';
import { Store } from 'lucide-react';

import { BUSINESS_CATEGORY_LABELS, type StoreListItem } from '@user/api/store';

import { formatDiscount, formatWalkTime } from './storeFormat';

interface FeaturedStoreCardProps {
  store: StoreListItem;
}

// 쿠폰 진행 중인 가게 중 가장 가까운 곳을 사진과 함께 크게 보여준다 (Figma 홈의 featured-card)
// 목록 맨 위 한 곳만 크게 두어, 같은 모양의 카드가 이어지는 목록에 시작점을 만든다
const FeaturedStoreCard = ({ store }: FeaturedStoreCardProps) => {
  const meta = [
    BUSINESS_CATEGORY_LABELS[store.businessCategory],
    store.distanceMeters !== null && formatWalkTime(store.distanceMeters),
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <li>
      <Link
        className="block overflow-hidden rounded-xl border border-border-subtle bg-bg-surface focus-visible:outline-2 focus-visible:outline-action-primary"
        to={`/stores/${store.storeId}`}
      >
        <div className="relative h-44 bg-surface-subtle">
          {store.thumbnailUrl ? (
            <img
              alt=""
              className="size-full object-cover"
              height={176}
              src={store.thumbnailUrl}
              width={350}
            />
          ) : (
            <div
              aria-hidden="true"
              className="flex size-full items-center justify-center text-text-tertiary"
            >
              <Store className="size-10" />
            </div>
          )}
          <span className="absolute top-3 left-3 rounded-full bg-action-primary px-2.5 py-1 text-caption-mobile font-bold text-text-inverse">
            가장 가까운 쿠폰
          </span>
        </div>
        <div className="flex items-end justify-between gap-3 p-4">
          <div className="min-w-0">
            <p className="truncate text-h3-mobile font-bold text-text-primary">
              {store.name}
            </p>
            <p className="mt-1 truncate text-caption-mobile text-text-secondary">
              {meta}
            </p>
          </div>
          {store.activeCampaign && (
            <p className="shrink-0 text-h3-mobile font-bold text-text-brand">
              {formatDiscount(store.activeCampaign)}
            </p>
          )}
        </div>
      </Link>
    </li>
  );
};

export default FeaturedStoreCard;
