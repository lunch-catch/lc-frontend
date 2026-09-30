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
import { useSwipeGesture } from './useSwipeGesture';

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

  const { cardProps, direction, swipe } = useSwipeGesture({
    onSwipe: handleSwipe,
  });

  return (
    <>
      {/* 위치 설정(#14) 전까지는 고정 위치를 보여준다 */}
      <AppHeader locationName="강남역 주변" />
      {topCard && (
        // 날아가는 카드 때문에 가로 스크롤이 생기지 않도록 잘라낸다
        <section className="flex flex-1 flex-col overflow-x-clip px-page pt-2 pb-3">
          {/* 카드와 버튼을 한 묶음으로 남는 높이의 세로 가운데에 둔다 */}
          <div className="@container relative mx-auto flex w-full max-w-82 flex-1 flex-col justify-center">
            {/* 카드는 남는 높이만큼 늘어나되, 사진이 4:5(125cqw)보다 길어지지 않게 한다 */}
            {/* 10.5rem은 사진 아래 글자 영역의 높이 */}
            <div className="relative flex max-h-[calc(125cqw+10.5rem)] flex-1 flex-col">
              {/* 다음 카드가 뒤에 살짝 보이도록 작게 겹쳐 둔다 */}
              {nextCard && (
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 top-2 flex origin-top scale-95 flex-col"
                >
                  <PosterCard card={nextCard} />
                </div>
              )}
              {/* 좌우로만 끌고, 위아래 움직임은 화면 스크롤에 맡긴다 */}
              <div
                className="relative flex flex-1 cursor-grab touch-pan-y flex-col select-none active:cursor-grabbing"
                key={topCard.serveId}
                {...cardProps}
              >
                {/* 끌기 움직임과 겹치지 않도록 다가오는 움직임은 안쪽 요소에 준다 */}
                <div className="flex flex-1 origin-top animate-card-enter flex-col motion-reduce:animate-none">
                  <PosterCard card={topCard} />
                </div>
              </div>
            </div>
            <GestureRail
              direction={direction}
              onPass={() => swipe('pass')}
              onWish={() => swipe('wish')}
              storeName={topCard.storeName}
            />
            <p className="mt-1 text-center text-caption-mobile text-text-secondary">
              찜은 발급 전 단계예요 · 11:00부터 찜 목록에서 받기
            </p>
          </div>
        </section>
      )}
    </>
  );
};

export default SwipeFeed;
