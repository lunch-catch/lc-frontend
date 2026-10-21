import { Link } from 'react-router';
import { Store } from 'lucide-react';

import { BUSINESS_CATEGORY_LABELS, type StoreListItem } from '@user/api/store';
import { cardClassName } from '@user/ui/Card/Card';
import {
  formatDiscount,
  formatDiscountTarget,
  formatWalkTime,
} from '@user/ui/storeFormat';

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
  const target =
    store.activeCampaign && formatDiscountTarget(store.activeCampaign);

  return (
    <li>
      <Link
        className={`block overflow-hidden focus-visible:outline-2 focus-visible:outline-action-primary ${cardClassName}`}
        to={`/stores/${store.storeId}`}
      >
        <div className="relative h-36 bg-surface-subtle">
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
        {/* 한 장뿐인 대표 카드라 이름은 굵게 두되, 아래 작은 카드와 크기 차이가 너무 나지 않게 한 단계 낮춘다 */}
        <div className="flex items-end justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-body-mobile font-bold text-text-primary">
              {store.name}
            </p>
            <p className="mt-1 truncate text-caption-mobile text-text-secondary">
              {meta}
            </p>
          </div>
          {/* 할인 대상은 할인 아래에 작게 두어, 왼쪽 가게 이름·업종 두 줄과 높이를 맞춘다 */}
          {store.activeCampaign && (
            <div className="max-w-[45%] shrink-0 text-right">
              <p className="text-body-mobile font-bold text-text-brand">
                {formatDiscount(store.activeCampaign)}
              </p>
              {target && (
                <p className="mt-1 truncate text-caption-mobile text-text-secondary">
                  {target}
                </p>
              )}
            </div>
          )}
        </div>
      </Link>
    </li>
  );
};

export default FeaturedStoreCard;
