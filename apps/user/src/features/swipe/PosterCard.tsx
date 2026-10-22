import { useEffect, useState } from 'react';

import { type FeedCard, fetchPosterHtml } from '@user/api/feed';
import { BUSINESS_CATEGORY_LABELS } from '@user/api/store';
import PosterFrame from '@user/ui/PosterFrame/PosterFrame';

import { formatFeedDiscount } from './feedFormat';

interface PosterCardProps {
  card: FeedCard;
}

// 카드 포스터 HTML. undefined면 받는 중, null이면 받지 못함
const usePosterHtml = (posterUrl: string) => {
  const [poster, setPoster] = useState<{
    url: string;
    html: string | null;
  } | null>(null);

  useEffect(() => {
    let ignore = false;

    fetchPosterHtml(posterUrl)
      .then((html) => {
        if (!ignore) setPoster({ url: posterUrl, html: html || null });
      })
      .catch(() => {
        if (!ignore) setPoster({ url: posterUrl, html: null });
      });

    // 응답 전에 카드가 바뀌거나 화면을 벗어나면 결과를 버린다
    return () => {
      ignore = true;
    };
  }, [posterUrl]);

  // 카드가 바뀐 직후에는 이전 카드의 포스터를 보여주지 않는다
  return poster?.url === posterUrl ? poster.html : undefined;
};

// 포스터를 받지 못했을 때 대신 보여주는 간단한 포스터. 가게 이름과 할인만 크게 둔다
// 사용자가 찜해서 보는 광고라 광고 표시를 붙이지 않는다 (멘토링 피드백, 2026-10)
const FallbackPoster = ({ card }: PosterCardProps) => (
  <div className="absolute inset-0 flex flex-col justify-end bg-surface-brand p-5">
    <div className="flex flex-col gap-2">
      <p className="text-caption-mobile font-medium text-text-secondary">
        {BUSINESS_CATEGORY_LABELS[card.category]}
      </p>
      <p className="text-h2-mobile font-bold break-keep text-text-primary">
        {card.storeName}
      </p>
      <p className="text-display-mobile leading-tight font-black break-keep text-text-brand">
        {formatFeedDiscount(card.discount)}
      </p>
    </div>
  </div>
);

// 스와이프 피드의 가게 포스터 카드. 점주가 만든 포스터를 그대로 보여주고, 앱이 따로 덧그리지 않는다
// 할인 내용과 기간은 포스터 템플릿의 필수 칸에, 11:00 오픈은 카드 위 카운트다운과 아래 안내에 있다 (피드 명세)
const PosterCard = ({ card }: PosterCardProps) => {
  const posterHtml = usePosterHtml(card.posterUrl);

  return (
    // 다크 모드는 그림자가 바탕에 묻혀서 테두리로 카드 경계를 보여준다
    <article className="flex flex-1 flex-col overflow-hidden rounded-lg bg-bg-surface shadow-[0_8px_16px_rgba(47,42,39,0.1)] dark:border dark:border-border-subtle">
      {/* 포스터는 점주 화면과 같은 A4(210:297)로 보이도록 카드 높이를 맞추되, 화면이 낮으면 줄어든다 */}
      {/* 포스터를 받는 동안에는 회색 배경이 보인다 */}
      <div className="relative min-h-56 flex-1 bg-surface-subtle">
        {posterHtml && (
          // 광고 표시는 포스터 안에 있어 카드에 따로 달지 않는다 (표시광고법)
          // 템플릿마다 광고 라벨 자리가 필수이고 점주가 지우거나 가릴 수 없어 모든 포스터에 들어 있다 (포스터 명세)
          <PosterFrame html={posterHtml} title={`${card.storeName} 포스터`} />
        )}
        {posterHtml === null && <FallbackPoster card={card} />}
      </div>
    </article>
  );
};

export default PosterCard;
