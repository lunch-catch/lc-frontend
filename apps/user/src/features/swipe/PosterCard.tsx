import type { FeedCard } from '@user/api/feed';

interface PosterCardProps {
  card: FeedCard;
}

const formatPrice = (price: number) => `${price.toLocaleString('ko-KR')}원`;

// 스와이프 피드의 가게 포스터 카드
const PosterCard = ({ card }: PosterCardProps) => {
  return (
    <article className="overflow-hidden rounded-lg bg-bg-surface shadow-[0_8px_16px_rgba(47,42,39,0.1)]">
      <div className="relative h-80">
        <img
          alt=""
          className="size-full object-cover"
          draggable={false}
          src={card.imageUrl}
        />
        {/* 사진 위 흰 글자가 잘 보이도록 아래쪽을 어둡게 덮는다 */}
        <div className="absolute inset-x-0 bottom-0 h-33 bg-linear-to-b from-transparent to-black/80" />
        <span className="absolute top-4.5 left-4.5 rounded-full bg-bg-page px-3 py-1 text-caption-mobile font-bold text-text-primary">
          도보 {card.walkMinutes}분
        </span>
        <div className="absolute inset-x-4.5 bottom-6 text-text-inverse">
          <h2 className="truncate text-h1 font-bold">{card.storeName}</h2>
          <p className="mt-1 text-body-sm-mobile font-medium">
            {card.category} · 발급 {card.issueOpenTime} 오픈
          </p>
        </div>
      </div>
      <div className="px-4.5 pt-4 pb-6">
        {/* 표시광고법에 따라 모든 카드에 광고임을 표시한다 */}
        <span className="inline-block rounded-full bg-surface-subtle px-4 py-1 text-caption-mobile font-bold text-text-secondary">
          광고
        </span>
        <p className="mt-2.5 text-body-mobile font-bold text-text-primary">
          {card.offerTitle}
        </p>
        <p className="mt-1 flex items-baseline gap-2">
          <del className="text-body-sm-mobile text-text-secondary">
            {formatPrice(card.originalPrice)}
          </del>
          <strong className="text-h1 font-bold text-text-primary">
            {formatPrice(card.salePrice)}
          </strong>
        </p>
        <p className="mt-2 text-caption-mobile font-medium text-text-secondary">
          사용 {card.usableFrom}–{card.usableTo} · 잔여 {card.remainingCount}장
        </p>
      </div>
    </article>
  );
};

export default PosterCard;
