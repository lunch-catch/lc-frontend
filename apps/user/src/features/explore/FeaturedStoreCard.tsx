import { type LiHTMLAttributes, useState } from 'react';
import { Link } from 'react-router';
import { Store } from 'lucide-react';

import { BUSINESS_CATEGORY_LABELS, type StoreListItem } from '@user/api/store';
import { cardClassName } from '@user/ui/Card/Card';
import FadeImage from '@user/ui/FadeImage/FadeImage';
import {
  formatDiscount,
  formatDiscountTarget,
  formatWalkTime,
} from '@user/ui/storeFormat';

interface FeaturedStoreCardProps {
  store: StoreListItem;
  // single: 한 장만 크게 둔다, slide: 가까운 쿠폰 슬라이드 안의 한 장이다 (점주 등록 칸과 같은 16:9 틀에 글자를 사진 위에 얹는다)
  variant?: 'single' | 'slide';
  // 슬라이드에서 가까운 순서(1부터). 사진 왼쪽 위에 숫자로 보여준다
  rank?: number;
  // 슬라이드가 카드의 위치와 움직임을 정할 때 넘기는 목록 항목 속성
  itemProps?: LiHTMLAttributes<HTMLLIElement>;
}

// 쿠폰 진행 중인 가게를 사진과 함께 크게 보여준다 (Figma 홈의 featured-card)
// 가까운 쿠폰 가게가 한 곳뿐이면 한 장으로, 여러 곳이면 슬라이드(NearbyCouponSlider) 안에서 쓴다
const FeaturedStoreCard = ({
  itemProps,
  rank,
  store,
  variant = 'single',
}: FeaturedStoreCardProps) => {
  const isSlide = variant === 'slide';
  const meta = [
    BUSINESS_CATEGORY_LABELS[store.businessCategory],
    store.distanceMeters !== null && formatWalkTime(store.distanceMeters),
  ]
    .filter(Boolean)
    .join(' · ');
  const target =
    store.activeCampaign && formatDiscountTarget(store.activeCampaign);
  const [hasImageError, setHasImageError] = useState(false);
  const hasImage = Boolean(store.thumbnailUrl) && !hasImageError;

  const photo = hasImage ? (
    <FadeImage
      alt=""
      className="size-full"
      height={176}
      onError={() => setHasImageError(true)}
      src={store.thumbnailUrl ?? undefined}
      width={350}
    />
  ) : (
    // 주소가 있어도 열리지 않으면 깨진 그림 대신 가게 아이콘을 둔다
    <div
      aria-hidden="true"
      className={`flex size-full items-center justify-center ${isSlide ? 'text-text-inverse/40' : 'text-text-tertiary'}`}
    >
      <Store className="size-10" />
    </div>
  );

  // 슬라이드: 점주가 등록 칸에서 본 것과 같은 16:9 틀에 글자를 사진 위에 얹는다
  // 사진이 밝아도 읽히도록 아래쪽에 어두운 그라데이션을 깔고, 사진이 없으면 어두운 바탕을 쓴다
  // 슬라이드는 제목이 가까운 순 쿠폰이라고 말하므로 카드마다 "가장 가까운 쿠폰" 배지를 붙이지 않는다
  if (isSlide) {
    return (
      <li {...itemProps}>
        <Link
          className="relative block aspect-video overflow-hidden rounded-2xl shadow-[0_6px_16px_rgba(47,42,39,0.14)] ring-1 ring-black/5 focus-visible:outline-2 focus-visible:outline-action-primary"
          to={`/stores/${store.storeId}`}
        >
          <div
            className={`absolute inset-0 ${hasImage ? 'bg-surface-subtle' : 'bg-(--primitive-neutral-900)'}`}
          >
            {photo}
          </div>
          {/* 거리순 번호다. 인기 순위로 읽히지 않도록 왕관이나 "1위" 같은 말은 쓰지 않고, 사진을 가리지 않게 반투명으로 둔다 */}
          {rank !== undefined && (
            <>
              <span
                aria-hidden="true"
                className="absolute top-2.5 left-2.5 flex size-6 items-center justify-center rounded-full bg-black/40 text-caption-mobile font-bold text-white ring-1 ring-white/40 backdrop-blur-sm"
              >
                {rank}
              </span>
              <span className="sr-only">가까운 순 {rank}번째</span>
            </>
          )}
          <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/75 via-black/35 to-transparent px-3.5 pt-12 pb-3 text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.4)]">
            {store.activeCampaign && (
              <p className="flex items-center gap-1.5">
                <span className="rounded-full bg-action-primary px-2 py-0.5 text-caption-mobile font-bold text-text-inverse [text-shadow:none]">
                  {formatDiscount(store.activeCampaign)}
                </span>
                {target && (
                  <span className="text-caption-mobile font-medium text-white/90">
                    {target}
                  </span>
                )}
              </p>
            )}
            <p className="mt-1.5 truncate text-body-mobile font-bold">
              {store.name}
            </p>
            <p className="truncate text-caption-mobile text-white/80">{meta}</p>
          </div>
        </Link>
      </li>
    );
  }

  return (
    <li>
      <Link
        className={`block overflow-hidden focus-visible:outline-2 focus-visible:outline-action-primary ${cardClassName}`}
        to={`/stores/${store.storeId}`}
      >
        <div className="relative h-36 bg-surface-subtle">
          {photo}
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
