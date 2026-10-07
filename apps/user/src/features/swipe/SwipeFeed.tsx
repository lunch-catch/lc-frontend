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
import PosterSkeleton from './PosterSkeleton';
import SwipeClosed from './SwipeClosed';
import SwipeDone from './SwipeDone';
import { usePosterFitWidth } from './usePosterFitWidth';
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

type FeedStatus = 'loading' | 'serving' | 'closed';

const SwipeFeed = () => {
  const [status, setStatus] = useState<FeedStatus>('loading');
  const [cards, setCards] = useState<FeedCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [wishCount, setWishCount] = useState(getWishCount);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  // 같은 카드의 노출이 두 번 기록되지 않도록 보낸 serveId를 기억한다
  const impressedServeIds = useRef(new Set<string>());
  const [setCardArea, cardMaxWidth] = usePosterFitWidth();

  useEffect(() => {
    let ignore = false;

    fetchFeed().then((response) => {
      if (ignore) return;

      setStatus(response.status);
      if (response.status === 'serving') {
        setCards(response.cards);
      }
    });

    // 응답 전에 화면을 벗어나면 결과를 버린다
    return () => {
      ignore = true;
    };
  }, []);

  const topCard = cards[currentIndex];
  // 맨 앞 카드와 그 뒤 두 장. 뒤 카드의 포스터를 미리 그려 두어 넘길 때 깜빡이지 않게 한다
  const visibleCards = cards.slice(currentIndex, currentIndex + 3);
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
        {status === 'closed' && <SwipeClosed />}
        {isDone && <SwipeDone />}
        {/* 불러오는 중에는 카드 자리에 회색 틀을 보여준다 */}
        {(status === 'loading' || topCard) && (
          // 날아가는 카드 때문에 가로 스크롤이 생기지 않도록 잘라낸다
          <section
            className="flex flex-1 flex-col overflow-x-clip px-page pt-2 pb-3"
            ref={setCardArea}
          >
            {/* 카드와 버튼을 한 묶음으로 남는 높이의 세로 가운데에 둔다 */}
            {/* PC처럼 화면이 낮으면 포스터가 3:4를 지키도록 묶음 폭을 줄인다 */}
            <div
              className="@container relative mx-auto flex w-full flex-1 flex-col justify-center"
              style={{ maxWidth: cardMaxWidth }}
            >
              {/* 카드는 남는 높이만큼 늘어나되, 포스터가 점주 화면과 같은 3:4(133.33cqw)보다 길어지지 않게 한다 */}
              {/* 69px은 포스터 아래 가격과 시간 영역의 높이 */}
              <div className="relative flex max-h-[calc(133.33cqw+69px)] flex-1 flex-col">
                {!topCard && (
                  <>
                    <PosterSkeleton />
                    <p className="sr-only" role="status">
                      포스터를 불러오는 중이에요
                    </p>
                  </>
                )}
                {/* 맨 앞, 바로 뒤, 그다음 카드까지 미리 그려 둔다 */}
                {/* 카드마다 key가 같아서 뒤에 있던 카드가 앞으로 와도 포스터를 다시 그리지 않고 자리만 옮긴다 */}
                {visibleCards.map((card, position) => {
                  const isTop = position === 0;

                  return (
                    <div
                      aria-hidden={isTop ? undefined : true}
                      className={
                        isTop
                          ? // 좌우로만 끌고, 위아래 움직임은 화면 스크롤에 맡긴다
                            'relative z-10 flex flex-1 cursor-grab touch-pan-y flex-col select-none active:cursor-grabbing'
                          : 'pointer-events-none absolute inset-0 flex flex-col'
                      }
                      key={card.serveId}
                      {...(isTop ? cardProps : {})}
                    >
                      {/* 끌기 움직임과 겹치지 않도록 크기와 위치 변화는 안쪽 요소에 준다 */}
                      {/* 바로 뒤 카드는 작게 겹쳐 보이고, 앞으로 오면 원래 크기로 커진다. 그다음 카드는 숨겨 두고 미리 그리기만 한다 */}
                      <div
                        className={`flex flex-1 origin-top flex-col transition-[translate,scale,opacity] duration-200 ease-out motion-reduce:transition-none ${
                          isTop
                            ? ''
                            : `translate-y-2 scale-95 ${position === 2 ? 'opacity-0' : ''}`
                        }`}
                      >
                        <PosterCard card={card} />
                      </div>
                    </div>
                  );
                })}
              </div>
              <GestureRail
                direction={direction}
                disabled={!topCard}
                onPass={() => swipe('pass')}
                onWish={() => swipe('wish')}
                storeName={topCard?.storeName}
              />
              {/* 로딩 중에도 보여서 카드가 뜰 때 위치가 들썩이지 않게 한다 */}
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
