import type { FeedCard } from '@user/api/feed';

interface PosterCardProps {
  card: FeedCard;
}

const formatPrice = (price: number) => `${price.toLocaleString('ko-KR')}원`;

// 스와이프 피드의 가게 포스터 카드. 위는 점주가 만든 포스터, 아래는 찜할지 정하는 데 필요한 가격과 시간
const PosterCard = ({ card }: PosterCardProps) => {
  return (
    <article className="flex flex-1 flex-col overflow-hidden rounded-lg bg-bg-surface shadow-[0_8px_16px_rgba(47,42,39,0.1)]">
      {/* 포스터는 점주 화면과 같은 3:4로 보이도록 카드 높이를 맞추되, 화면이 낮으면 줄어든다 */}
      {/* 포스터를 그리는 동안에는 회색 배경이 보인다 */}
      <div className="relative min-h-56 flex-1 bg-surface-subtle">
        {/* 광고 표시는 포스터 안에 있어 카드에 따로 달지 않는다 (표시광고법) */}
        {/* 템플릿마다 광고 라벨 자리가 필수이고 점주가 지우거나 가릴 수 없어 모든 포스터에 들어 있다 (포스터 명세) */}
        <iframe
          // 포스터는 보기만 하는 그림이라 터치를 받지 않게 해서, 그 위에서도 카드를 끌 수 있게 한다
          className="pointer-events-none absolute inset-0 size-full border-0"
          // 포스터 안의 스크립트, 폼, 링크 이동을 모두 막는다
          sandbox=""
          srcDoc={card.posterHtml}
          tabIndex={-1}
          title={`${card.storeName} 포스터`}
        />
      </div>
      {/* 가게 이름과 할인 문구는 포스터에 있어, 아래에는 가격과 시간만 짧게 둔다 */}
      <div className="flex items-center justify-between gap-3 px-4.5 py-3">
        <div className="min-w-0">
          <p className="flex items-baseline gap-1.5">
            <del className="text-caption-mobile text-text-secondary">
              {formatPrice(card.originalPrice)}
            </del>
            <strong className="text-h3-mobile font-bold text-text-primary">
              {formatPrice(card.salePrice)}
            </strong>
          </p>
          <p className="truncate text-caption-mobile font-medium text-text-secondary">
            발급 {card.issueOpenTime} 오픈 · 사용 {card.usableFrom}–
            {card.usableTo}
          </p>
        </div>
        <span className="shrink-0 text-caption-mobile font-medium text-text-secondary">
          도보 {card.walkMinutes}분
        </span>
      </div>
    </article>
  );
};

export default PosterCard;
