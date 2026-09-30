import { useEffect, useRef, useState } from 'react';

import {
  type FeedCard,
  fetchFeed,
  sendImpression,
  sendSwipeAction,
  type SwipeAction,
} from '@user/api/feed';
import AppHeader from '@user/components/AppHeader/AppHeader';

import GestureRail from './GestureRail';
import PosterCard from './PosterCard';

const SwipeFeed = () => {
  const [cards, setCards] = useState<FeedCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  // 같은 카드의 노출이 두 번 기록되지 않도록 보낸 serveId를 기억한다
  const impressedServeIds = useRef(new Set<string>());

  useEffect(() => {
    let ignore = false;

    fetchFeed().then((response) => {
      if (!ignore && response.status === 'serving') {
        setCards(response.cards);
      }
    });

    // 응답 전에 화면을 벗어나면 결과를 버린다
    return () => {
      ignore = true;
    };
  }, []);

  const topCard = cards[currentIndex];
  const nextCard = cards[currentIndex + 1];

  useEffect(() => {
    if (topCard && !impressedServeIds.current.has(topCard.serveId)) {
      impressedServeIds.current.add(topCard.serveId);
      sendImpression(topCard);
    }
  }, [topCard]);

  const handleSwipe = (action: SwipeAction) => {
    if (!topCard) return;

    sendSwipeAction(topCard, action);
    setCurrentIndex((index) => index + 1);
  };

  return (
    <>
      {/* 위치 설정(#14) 전까지는 고정 위치를 보여준다 */}
      <AppHeader locationName="강남역 주변" />
      {topCard && (
        <section className="px-page pt-2">
          <div className="relative mx-auto max-w-82">
            {/* 다음 카드가 뒤에 살짝 보이도록 작게 겹쳐 둔다 */}
            {nextCard && (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-2 origin-top scale-95"
              >
                <PosterCard card={nextCard} />
              </div>
            )}
            <div className="relative">
              <PosterCard card={topCard} key={topCard.serveId} />
            </div>
            <GestureRail
              onPass={() => handleSwipe('pass')}
              onWish={() => handleSwipe('wish')}
              storeName={topCard.storeName}
            />
          </div>
          <p className="mt-1 text-center text-caption-mobile text-text-secondary">
            찜은 발급 전 단계예요 · 11:00부터 찜 목록에서 받기
          </p>
        </section>
      )}
    </>
  );
};

export default SwipeFeed;
