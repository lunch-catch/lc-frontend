import { useEffect, useRef, useState } from 'react';

import {
  type FeedCard,
  fetchFeed,
  getWishCount,
  sendImpression,
  sendSwipeAction,
  type SwipeAction,
} from '@user/api/feed';
import AppHeader from '@user/components/AppHeader/AppHeader';
import FeedbackToast from '@user/components/FeedbackToast/FeedbackToast';

import GestureRail from './GestureRail';
import PosterCard from './PosterCard';
import SwipeDone from './SwipeDone';
import { useSwipeGesture } from './useSwipeGesture';

const TOAST_DURATION_MS = 2500;
const FIRST_WISH_STORAGE_KEY = 'launch-catch-first-wish-date';

// 오늘 처음 찜했는지 확인하고, 처음이면 오늘 날짜를 기록한다
const checkFirstWishToday = () => {
  const today = new Date().toLocaleDateString('sv-SE');

  try {
    if (window.localStorage.getItem(FIRST_WISH_STORAGE_KEY) === today) {
      return false;
    }
    window.localStorage.setItem(FIRST_WISH_STORAGE_KEY, today);
  } catch {
    // 저장소를 쓸 수 없으면 매번 처음으로 본다
  }

  return true;
};

const SwipeFeed = () => {
  const [cards, setCards] = useState<FeedCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [wishCount, setWishCount] = useState(getWishCount);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
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
  const isDone = cards.length > 0 && currentIndex >= cards.length;

  useEffect(() => {
    if (topCard && !impressedServeIds.current.has(topCard.serveId)) {
      impressedServeIds.current.add(topCard.serveId);
      sendImpression(topCard);
    }
  }, [topCard]);

  useEffect(() => {
    if (!toastMessage) return;

    const timer = setTimeout(() => setToastMessage(null), TOAST_DURATION_MS);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  const handleSwipe = (action: SwipeAction) => {
    if (!topCard) return;

    sendSwipeAction(topCard, action);
    setCurrentIndex((index) => index + 1);

    if (action === 'wish') {
      setWishCount(getWishCount());

      // 찜은 발급이 아니라는 걸 그날 첫 찜에서 한 번만 알려준다
      if (checkFirstWishToday()) {
        setToastMessage('찜 목록에 담았어요 · 11:00부터 받을 수 있어요');
      }
    }
  };

  const { cardProps, direction, swipe } = useSwipeGesture({
    onSwipe: handleSwipe,
  });

  return (
    <>
      {/* 위치 설정(#14) 전까지는 고정 위치를 보여준다 */}
      <AppHeader locationName="강남역 주변" wishCount={wishCount} />
      {/* 토스트를 헤더 바로 아래에 띄우기 위한 기준 영역 */}
      <div className="relative flex flex-1 flex-col">
        {toastMessage && (
          <div className="absolute inset-x-0 top-0 z-20 px-page pt-3">
            <FeedbackToast message={toastMessage} />
          </div>
        )}
        {isDone && <SwipeDone onRestart={() => setCurrentIndex(0)} />}
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
      </div>
    </>
  );
};

export default SwipeFeed;
