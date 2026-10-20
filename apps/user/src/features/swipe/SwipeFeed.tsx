import { useEffect, useRef, useState } from 'react';

import { ApiError } from '@user/api/client';
import {
  type FeedCard,
  fetchFeed,
  sendImpression,
  sendSwipeAction,
  type SwipeAction,
} from '@user/api/feed';
import {
  getHeaderLocationName,
  useMyLocation,
} from '@user/features/location/useMyLocation';
import { useHasUnreadNotifications } from '@user/features/notification/useHasUnreadNotifications';
import {
  getIssuePhase,
  type IssuePhase,
} from '@user/features/wishlist/useOpenCountdown';
import { useWishCount } from '@user/features/wishlist/useWishCount';
import AppHeader from '@user/ui/AppHeader/AppHeader';
import FeedbackToast from '@user/ui/FeedbackToast/FeedbackToast';

import FeedFilterButton from './FeedFilterButton';
import {
  clearFeedSession,
  clearRateLimitedUntil,
  type FeedSession,
  loadFeedSession,
  loadImpressedServeIds,
  loadRateLimitedUntil,
  saveFeedSession,
  saveImpressedServeIds,
  saveRateLimitedUntil,
} from './feedSession';
import GestureRail from './GestureRail';
import OpenCountdown from './OpenCountdown';
import PosterCard from './PosterCard';
import PosterSkeleton from './PosterSkeleton';
import SwipeDone from './SwipeDone';
import SwipeHint from './SwipeHint';
import SwipeUnavailable, {
  type SwipeUnavailableReason,
} from './SwipeUnavailable';
import SwipeWaiting from './SwipeWaiting';
import { usePosterFitWidth } from './usePosterFitWidth';
import { useSwipeGesture } from './useSwipeGesture';

const TOAST_DURATION_MS = 2500;
const FIRST_WISH_STORAGE_KEY = 'launch-catch-first-wish-date';

// 그날 첫 찜 토스트에서 쿠폰을 언제 받는지. 카드 아래 안내(SwipeHint)와 같은 때를 말한다
const WISH_TOAST_TIMING: Record<IssuePhase, string> = {
  beforeOpen: '11:00부터 쿠폰을 받을 수 있어요',
  issuing: '지금 바로 쿠폰을 받을 수 있어요',
  closed: '내일 11:00부터 쿠폰을 받을 수 있어요',
};

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

// waiting: 다음 피드를 받을 수 있을 때까지 기다리는 중, done: 오늘 받을 수 있는 카드를 모두 넘김
type FeedStatus =
  'loading' | 'serving' | 'waiting' | 'done' | SwipeUnavailableReason;

// 피드를 받지 못한 이유를 화면에 맞게 나눈다. 저장한 위치가 없으면 위치 설정으로 안내한다
const getFeedFailure = (error: unknown): SwipeUnavailableReason =>
  error instanceof ApiError && error.code === 'ADSERVING-002'
    ? 'needsLocation'
    : 'error';

// 60초에 6회를 넘겨 거절됐으면 다시 요청할 수 있을 때까지 남은 초. 아니면 null
const getRateLimitSeconds = (error: unknown) =>
  error instanceof ApiError && error.code === 'ADSERVING-003'
    ? (error.retryAfterSeconds ?? 60)
    : null;

// 처음 화면을 열 때의 상태. 저장해 둔 피드 묶음이 있으면 피드를 다시 받지 않고 보던 카드부터 이어 본다
// 다 넘긴 묶음이면 다음 피드를 받을 수 있는 시각까지 기다리고, 그 시각이 지났으면 새로 받는다
const getInitialFeed = () => {
  const session: FeedSession | null = loadFeedSession();
  const hasCardsLeft =
    session !== null && session.currentIndex < session.cards.length;
  const isWaiting =
    session !== null &&
    !hasCardsLeft &&
    session.nextFeedAt !== null &&
    Date.now() < session.nextFeedAt;

  // 요청 제한(429)으로 기다리던 중에 새로고침했으면 남은 시간만큼 이어서 기다린다
  const rateLimitedUntil =
    hasCardsLeft || isWaiting ? null : loadRateLimitedUntil();

  let status: FeedStatus = 'loading';
  if (hasCardsLeft) status = 'serving';
  else if (isWaiting || rateLimitedUntil !== null) status = 'waiting';

  let waitUntil = 0;
  if (isWaiting) waitUntil = session?.nextFeedAt ?? 0;
  else if (rateLimitedUntil !== null) waitUntil = rateLimitedUntil;

  return {
    status,
    cards: session?.cards ?? [],
    currentIndex: session?.currentIndex ?? 0,
    nextFeedAt: session?.nextFeedAt ?? null,
    receivedAt: session?.receivedAt ?? 0,
    waitUntil,
    // 이어 볼 수 있으면 처음에 피드를 받지 않는다 (-1이면 받지 않음)
    attempt: status === 'loading' ? 0 : -1,
    hasServedCards: session !== null,
    // 429로 기다리던 중이었으면 이미 한 번 기다린 것이다. 또 거절되면 반복하지 않는다
    hasRetriedRateLimit: rateLimitedUntil !== null,
  };
};

const SwipeFeed = () => {
  const [initial] = useState(getInitialFeed);
  const [status, setStatus] = useState<FeedStatus>(initial.status);
  const [cards, setCards] = useState<FeedCard[]>(initial.cards);
  const [currentIndex, setCurrentIndex] = useState(initial.currentIndex);
  // 지금 묶음을 받은 시각. 저장한 묶음이 오래됐는지 볼 때 쓴다
  const [receivedAt, setReceivedAt] = useState(initial.receivedAt);
  const {
    increase: increaseWishCount,
    refresh: refreshWishCount,
    wishCount,
  } = useWishCount();
  // 피드는 저장 위치 기준이라, 노출을 기록할 때 같은 좌표를 보낸다
  const myLocation = useMyLocation();
  const locationName = getHeaderLocationName(myLocation);
  const hasUnreadNotifications = useHasUnreadNotifications();
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  // 다시 시도할 때마다 올려서 피드를 새로 받는다
  const [attempt, setAttempt] = useState(initial.attempt);
  // 다음 피드를 요청해도 되는 시각. 다 넘겼을 때 이때까지 기다렸다 받는다. null이면 다음 피드가 없다
  const [nextFeedAt, setNextFeedAt] = useState(initial.nextFeedAt);
  // waiting일 때 다시 요청할 시각
  const [waitUntil, setWaitUntil] = useState(initial.waitUntil);
  // 카드를 한 번이라도 받았는지. 받은 뒤 다음 피드가 비면 "오늘 다 봤어요"로 보여준다
  const hasServedCards = useRef(initial.hasServedCards);
  // 429로 기다렸다 다시 받은 적이 있는지. 명세대로 한 번만 다시 요청하고, 또 실패하면 반복하지 않는다
  const hasRetriedRateLimit = useRef(initial.hasRetriedRateLimit);
  // 같은 카드의 노출이 두 번 기록되지 않도록 보낸 serveId를 기억한다. 탭을 오가거나 새로고침해도 이어서 기억한다
  const impressedServeIds = useRef(new Set(loadImpressedServeIds()));
  const [setCardArea, cardMaxWidth] = usePosterFitWidth();

  useEffect(() => {
    // 저장해 둔 묶음으로 이어 볼 때는 받지 않는다
    if (attempt < 0) return;

    let ignore = false;

    fetchFeed()
      .then((response) => {
        if (ignore) return;

        hasRetriedRateLimit.current = false;
        clearRateLimitedUntil();
        if (response.status === 'serving') {
          hasServedCards.current = true;
          setCards(response.cards);
          setCurrentIndex(0);
          setReceivedAt(Date.now());
          setNextFeedAt(response.nextFeedAt);
          setStatus('serving');
          return;
        }
        // 카드를 넘긴 뒤 다음 피드가 비었으면 주변 카드를 오늘 모두 본 것이다
        setStatus(
          response.status === 'empty' && hasServedCards.current
            ? 'done'
            : response.status,
        );
      })
      .catch((error: unknown) => {
        if (ignore) return;

        const retryAfterSeconds = getRateLimitSeconds(error);
        if (retryAfterSeconds !== null && !hasRetriedRateLimit.current) {
          hasRetriedRateLimit.current = true;
          const until = Date.now() + retryAfterSeconds * 1000;
          saveRateLimitedUntil(until);
          setWaitUntil(until);
          setStatus('waiting');
          return;
        }
        setStatus(getFeedFailure(error));
      });

    // 응답 전에 화면을 벗어나면 결과를 버린다
    return () => {
      ignore = true;
    };
  }, [attempt]);

  // 보고 있는 묶음과 위치를 저장해 탭을 오가거나 새로고침해도 이어 보게 한다
  // 오늘 피드가 끝났거나(마감, 모두 봄) 받을 수 없으면 지워서 다음에 새로 받게 한다
  useEffect(() => {
    if (status === 'serving' || status === 'waiting') {
      if (cards.length > 0) {
        saveFeedSession({ cards, currentIndex, nextFeedAt, receivedAt });
      }
      return;
    }
    if (status !== 'loading') clearFeedSession();
  }, [cards, currentIndex, nextFeedAt, receivedAt, status]);

  const loadNextFeed = () => {
    setStatus('loading');
    setAttempt((current) => current + 1);
  };

  const retry = () => {
    hasRetriedRateLimit.current = false;
    loadNextFeed();
  };

  // 기다리는 시각이 되면 한 번 다시 받는다. 앱이 화면에 보일 때만 받는다 (명세의 요청 제한 규칙)
  useEffect(() => {
    if (status !== 'waiting') return;

    let isWaiting = true;
    const loadWhenVisible = () => {
      if (!isWaiting || document.visibilityState !== 'visible') return;
      isWaiting = false;
      loadNextFeed();
    };
    const timer = setTimeout(
      loadWhenVisible,
      Math.max(0, waitUntil - Date.now()),
    );
    // 기다리는 사이 앱이 뒤로 갔다 돌아오면 그때 받는다
    const handleVisible = () => {
      if (Date.now() >= waitUntil) loadWhenVisible();
    };
    document.addEventListener('visibilitychange', handleVisible);

    return () => {
      isWaiting = false;
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', handleVisible);
    };
  }, [status, waitUntil]);

  const topCard = cards[currentIndex];
  // 맨 앞 카드와 그 뒤 두 장. 뒤 카드의 포스터를 미리 그려 두어 넘길 때 깜빡이지 않게 한다
  const visibleCards = cards.slice(currentIndex, currentIndex + 3);

  const latitude = myLocation?.latitude ?? null;
  const longitude = myLocation?.longitude ?? null;

  // 맨 위 카드가 바뀌면 노출을 한 번 보낸다. 저장 위치를 받기 전이면 받은 뒤에 보낸다
  useEffect(() => {
    if (!topCard || latitude === null || longitude === null) return;
    if (impressedServeIds.current.has(topCard.serveId)) return;

    impressedServeIds.current.add(topCard.serveId);
    saveImpressedServeIds(impressedServeIds.current);
    sendImpression(topCard, { latitude, longitude });
  }, [latitude, longitude, topCard]);

  useEffect(() => {
    if (!toastMessage) return;

    const timer = setTimeout(() => setToastMessage(null), TOAST_DURATION_MS);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  const handleSwipe = (action: SwipeAction) => {
    if (!topCard) return;

    sendSwipeAction(topCard, action).catch(() => {
      // 찜이 서버에 들어가지 않았으면 미리 올린 찜 수를 바로잡고 알린다. 패스는 알리지 않는다
      if (action !== 'wish') return;
      refreshWishCount();
      setToastMessage('찜하지 못했어요 · 잠시 후 다시 시도해 주세요');
    });
    setCurrentIndex((index) => index + 1);

    // 마지막 카드를 넘기면 다음 피드를 받는다. 아직 이르면 받을 수 있는 시각까지 기다린다
    if (currentIndex + 1 >= cards.length) {
      if (nextFeedAt === null) {
        setStatus('done');
      } else if (Date.now() >= nextFeedAt) {
        loadNextFeed();
      } else {
        setWaitUntil(nextFeedAt);
        setStatus('waiting');
      }
    }

    if (action === 'wish') {
      increaseWishCount();

      // 찜은 발급이 아니라는 걸 그날 첫 찜에서 한 번만 알려준다. 받을 수 있는 때는 카드 아래 안내와 맞춘다
      // 한 줄에 다 들어가지 않아, 어색하게 끊기지 않도록 받는 때를 둘째 줄에 둔다
      if (checkFirstWishToday()) {
        setToastMessage(
          `찜 목록에 담았어요\n${WISH_TOAST_TIMING[getIssuePhase()]}`,
        );
      }
    }
  };

  const { cardProps, direction, swipe } = useSwipeGesture({
    onSwipe: handleSwipe,
  });

  return (
    <>
      <AppHeader
        hasUnreadNotifications={hasUnreadNotifications}
        locationName={locationName}
        wishCount={wishCount}
      />
      {/* 토스트를 헤더 바로 아래에 띄우기 위한 기준 영역 */}
      <div className="relative flex flex-1 flex-col">
        {toastMessage && (
          <div className="absolute inset-x-0 top-0 z-20 px-page pt-3">
            <FeedbackToast message={toastMessage} />
          </div>
        )}
        {(status === 'empty' ||
          status === 'needsLocation' ||
          status === 'error') && (
          <SwipeUnavailable onRetry={retry} reason={status} />
        )}
        {status === 'done' && <SwipeDone />}
        {status === 'waiting' && <SwipeWaiting until={waitUntil} />}
        {/* 불러오는 중에는 카드 자리에 회색 틀을 보여준다 */}
        {/* 카드 바로 위 줄. 왼쪽은 피드에 거는 필터("필터"라고 적어 처음 보는 사람도 알 수 있게 한다) */}
        {/* 오른쪽은 11:00 오픈까지 남은 시간. 오픈 뒤에는 비워 둔다 */}
        {(status === 'loading' || topCard) && (
          <div className="flex items-center justify-between gap-3 px-page pt-1">
            <FeedFilterButton
              onLoadError={() => setToastMessage('필터를 불러오지 못했어요')}
              // 필터는 이미 받은 카드에는 적용되지 않고, 지금 카드를 다 본 뒤 새로 받는 피드부터 적용된다
              onSaved={() =>
                setToastMessage(
                  '필터를 저장했어요 · 새로 받는 카드부터 적용돼요',
                )
              }
            />
            <OpenCountdown />
          </div>
        )}
        {(status === 'loading' || topCard) && (
          // 날아가는 카드 때문에 가로 스크롤이 생기지 않도록 잘라낸다
          <section
            className="relative flex flex-1 flex-col overflow-x-clip px-page pt-2 pb-2"
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
              <SwipeHint />
            </div>
          </section>
        )}
      </div>
    </>
  );
};

export default SwipeFeed;
