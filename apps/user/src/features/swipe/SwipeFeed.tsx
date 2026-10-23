import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';

import { ApiError } from '@user/api/client';
import { getNow } from '@user/api/clock';
import {
  type FeedCard,
  fetchFeed,
  sendImpression,
  sendSwipeAction,
  type SwipeAction,
} from '@user/api/feed';
import { type FeedFilter, saveFeedFilter } from '@user/api/feedFilter';
import {
  clearPrefetchedFeed,
  fetchPreparedFeed,
  getPrefetchedFeed,
  preparePosters,
} from '@user/hooks/posterPreload';
import { useDelayedLoading } from '@user/hooks/useDelayedLoading';
import {
  getHeaderLocationName,
  refreshMyLocation,
  useMyLocation,
} from '@user/hooks/useMyLocation';
import { getIssuePhase, WISH_ISSUE_TIMING } from '@user/hooks/useOpenCountdown';
import { useWishCount } from '@user/hooks/useWishCount';
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
import { useFeedFilter } from './useFeedFilter';
import { usePosterFitWidth } from './usePosterFitWidth';
import { useSwipeGesture } from './useSwipeGesture';

const TOAST_DURATION_MS = 2500;
// 남은 카드가 이만큼 이하가 되면 뒤에서 다음 피드를 미리 받아 둔다
// 다 넘긴 뒤에 받으면 그동안 불러오는 중 화면이 보인다. 1장은 빠르게 넘기는 사용자에게 아슬아슬해서 2장으로 둔다
const PREFETCH_REMAINING_CARDS = 2;

// 미리 받아 둔 다음 피드 묶음
interface NextBatch {
  cards: FeedCard[];
  nextFeedAt: number | null;
  receivedAt: number;
}

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
    getNow() < session.nextFeedAt;

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
  const navigate = useNavigate();
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
  // 이 화면에 들어온 뒤 찜 토스트를 띄웠는지. 새로고침하거나 다른 탭에 갔다 오면 다시 띄운다
  // 시간이 지나 다시 들어오면 그때의 받는 때(11:00부터, 지금 바로, 내일)를 다시 알려주려는 것이다
  const hasShownWishToast = useRef(false);
  const [setCardArea, cardMaxWidth] = usePosterFitWidth();
  const feedFilter = useFeedFilter();
  // 빈 화면에서 업종 필터를 푸는 중인지
  const [isClearingCategories, setIsClearingCategories] = useState(false);
  // 업종을 골라 둔 채 카드가 없으면 필터 때문일 수 있어, 필터를 풀어 보라고 따로 안내한다
  const hasCategoryFilter = (feedFilter.filter?.categories.length ?? 0) > 0;
  // 받는 동안 보여줄 모양 (loadNextFeed 참고)
  // 처음 들어올 때(initial)는 카드가 올지 빈 화면이 올지 몰라, 카드 자리를 미리 그리지 않는다
  // 미리 그리면 카드가 없을 때 회색 틀과 패스·찜 버튼이 나왔다가 빈 화면으로 바뀌며 번쩍인다
  const [loadingView, setLoadingView] = useState<
    'initial' | 'cards' | 'message'
  >('initial');
  const showPosterSkeleton = useDelayedLoading(
    status === 'loading' && loadingView !== 'message',
  );
  // 피드 응답을 받는 쪽(effect)에서 읽는다. 업종을 골라 둔 채 비면 "오늘 다 봤어요" 대신 필터 안내를 보여준다
  const hasCategoryFilterRef = useRef(hasCategoryFilter);
  useEffect(() => {
    hasCategoryFilterRef.current = hasCategoryFilter;
  }, [hasCategoryFilter]);

  useEffect(() => {
    // 저장해 둔 묶음으로 이어 볼 때는 받지 않는다
    if (attempt < 0) return;

    let ignore = false;

    // 로그인이나 온보딩을 마칠 때 받아 둔 첫 피드가 있으면 새로 받지 않고 이어받는다
    // 첫 카드의 포스터와 이미지까지 받아 둔 뒤에 카드를 그린다. 그동안은 불러오는 중 화면이 이어진다
    // 먼저 그리면 카드 안에서 회색, 글자, 이미지가 차례로 바뀌며 번쩍인다
    // 다시 시도(attempt 1 이상)는 새로 받는다
    const request =
      (attempt === 0 ? getPrefetchedFeed() : null) ?? fetchPreparedFeed();

    request
      .then((response) => {
        if (ignore) return;

        clearPrefetchedFeed();
        hasRetriedRateLimit.current = false;
        clearRateLimitedUntil();
        if (response.status === 'serving') {
          hasServedCards.current = true;
          setCards(response.cards);
          setCurrentIndex(0);
          setReceivedAt(getNow());
          setNextFeedAt(response.nextFeedAt);
          setStatus('serving');
          return;
        }
        // 카드를 넘긴 뒤 다음 피드가 비었으면 주변 카드를 오늘 모두 본 것이다
        // 업종을 골라 둔 채 비었으면 다른 업종은 남았을 수 있어 필터 안내(empty)로 둔다
        setStatus(
          response.status === 'empty' &&
            hasServedCards.current &&
            !hasCategoryFilterRef.current
            ? 'done'
            : response.status,
        );
      })
      .catch((error: unknown) => {
        if (ignore) return;

        const retryAfterSeconds = getRateLimitSeconds(error);
        if (retryAfterSeconds !== null && !hasRetriedRateLimit.current) {
          hasRetriedRateLimit.current = true;
          const until = getNow() + retryAfterSeconds * 1000;
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

  // 미리 받아 둔 다음 묶음. 마지막 카드를 넘기면 불러오는 중 화면 없이 바로 이어 붙인다
  const nextBatch = useRef<NextBatch | null>(null);
  const isPrefetching = useRef(false);
  // 보고 있는 묶음이 바뀔 때(새 묶음, 필터 변경, 다시 받기) 올려서, 그 전에 시작한 미리 받기 결과를 버린다
  const batchGeneration = useRef(0);
  const prefetchTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const isMounted = useRef(true);
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      clearTimeout(prefetchTimer.current);
    };
  }, []);

  // 남은 카드가 얼마 없으면 다음 피드를 미리 받는다
  // 받을 수 있는 시각(요청 제한)이 아직이면 그 시각에 받고, 앱이 뒤로 가 있으면 받지 않는다 (명세의 요청 제한 규칙)
  // 못 받거나 비었으면 조용히 그만두고, 다 넘긴 뒤 평소처럼 받는다
  useEffect(() => {
    if (status !== 'serving') return;
    const remaining = cards.length - currentIndex;
    if (remaining <= 0 || remaining > PREFETCH_REMAINING_CARDS) return;
    if (nextFeedAt === null || nextBatch.current || isPrefetching.current) {
      return;
    }

    isPrefetching.current = true;
    const generation = batchGeneration.current;
    const shownCampaignIds = new Set(cards.map((card) => card.campaignId));
    prefetchTimer.current = setTimeout(
      async () => {
        try {
          if (document.visibilityState !== 'visible') return;
          const response = await fetchFeed();
          if (response.status !== 'serving') return;

          // 서버가 이미 내려준 캠페인은 빼 주지만, 같은 카드가 두 번 보이지 않게 한 번 더 거른다
          const freshCards = response.cards.filter(
            (card) => !shownCampaignIds.has(card.campaignId),
          );
          if (freshCards.length === 0) return;

          await preparePosters(freshCards);
          if (!isMounted.current || generation !== batchGeneration.current) {
            return;
          }
          nextBatch.current = {
            cards: freshCards,
            nextFeedAt: response.nextFeedAt,
            receivedAt: getNow(),
          };
        } catch {
          // 받지 못했으면 다 넘긴 뒤 평소처럼 받는다
        } finally {
          isPrefetching.current = false;
        }
      },
      Math.max(0, nextFeedAt - getNow()),
    );
  }, [cards, currentIndex, nextFeedAt, status]);

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

  // view: 받는 동안 보여줄 모양. cards는 카드 자리(포스터 회색 틀), message는 기다림 화면과 같은 안내
  // 카드를 보다가 받으면 카드 자리를 그대로 두고, 기다림·빈 화면에서 받으면 그 화면 모양을 이어 간다
  // 화면 모양이 오가면 필터 줄이 위와 가운데를 오가며 번쩍여서, 받는 동안에는 직전 모양을 유지한다
  const loadNextFeed = (view: 'cards' | 'message' = 'cards') => {
    // 미리 받아 둔 묶음은 이 요청의 필터와 위치와 맞지 않을 수 있어 버린다
    nextBatch.current = null;
    batchGeneration.current += 1;
    setLoadingView(view);
    setStatus('loading');
    setAttempt((current) => current + 1);
  };

  const retry = () => {
    refreshMyLocation();
    hasRetriedRateLimit.current = false;
    loadNextFeed('message');
  };

  // 받아 둔 카드를 다 넘겼을 때. 다음 피드를 받고, 아직 이르면 받을 수 있는 시각까지 기다린다
  const moveToNextFeed = () => {
    // 미리 받아 둔 묶음이 있으면 불러오는 중 화면 없이 바로 이어 붙인다
    const batch = nextBatch.current;
    if (batch) {
      nextBatch.current = null;
      batchGeneration.current += 1;
      hasServedCards.current = true;
      setCards(batch.cards);
      setCurrentIndex(0);
      setReceivedAt(batch.receivedAt);
      setNextFeedAt(batch.nextFeedAt);
      return;
    }
    if (nextFeedAt === null) {
      setStatus('done');
    } else if (getNow() >= nextFeedAt) {
      loadNextFeed();
    } else {
      setWaitUntil(nextFeedAt);
      setStatus('waiting');
    }
  };

  const handleFilterSaved = (saved: FeedFilter) => {
    const isSortChanged = feedFilter.filter?.sort !== saved.sort;
    feedFilter.setFilter(saved);
    // 미리 받아 둔 묶음은 바꾸기 전 필터로 만든 것이라 버리고, 필요하면 다시 받는다
    nextBatch.current = null;
    batchGeneration.current += 1;
    if (topCard) {
      // 업종은 받아 둔 카드 중 아직 안 본 카드에 바로 적용해, 고른 업종이 아닌 카드는 숨긴다
      // 새로 받으면 다음 피드 시각 전이라 거절되거나 받아 둔 카드를 못 보게 될 수 있어, 서버에 다시 묻지 않는다
      // 정렬은 받은 순서를 바꾸지 말라는 규칙이 있어 다음 피드부터 적용된다
      const remaining = cards
        .slice(currentIndex)
        .filter(
          (card) =>
            saved.categories.length === 0 ||
            saved.categories.includes(card.category),
        );
      setCards([...cards.slice(0, currentIndex), ...remaining]);
      setToastMessage(
        isSortChanged
          ? '필터를 저장했어요 · 정렬은 새로 받는 카드부터 적용돼요'
          : '필터를 적용했어요',
      );
      if (remaining.length === 0) moveToNextFeed();
      return;
    }
    // 보여줄 카드가 없으면 기다리지 않고 바뀐 필터로 바로 다시 받는다
    // 요청 제한에 걸려 기다리는 중이면 그 시각에 바뀐 필터로 받는다
    setToastMessage('필터를 저장했어요');
    if (status !== 'loading' && status !== 'waiting') retry();
  };

  // 빈 화면의 "전체 업종 보기". 정렬은 그대로 두고 업종만 전체로 바꿔 저장한 뒤 바로 다시 받는다
  const showAllCategories = async () => {
    if (!feedFilter.filter || isClearingCategories) return;
    setIsClearingCategories(true);
    try {
      const saved = await saveFeedFilter({
        ...feedFilter.filter,
        categories: [],
      });
      feedFilter.setFilter(saved);
      retry();
    } catch {
      setToastMessage('필터를 바꾸지 못했어요 · 잠시 후 다시 시도해 주세요');
    } finally {
      setIsClearingCategories(false);
    }
  };

  // 기다리는 시각이 되면 한 번 다시 받는다. 앱이 화면에 보일 때만 받는다 (명세의 요청 제한 규칙)
  useEffect(() => {
    if (status !== 'waiting') return;

    let isWaiting = true;
    const loadWhenVisible = () => {
      if (!isWaiting || document.visibilityState !== 'visible') return;
      isWaiting = false;
      loadNextFeed('message');
    };
    const timer = setTimeout(
      loadWhenVisible,
      Math.max(0, waitUntil - getNow()),
    );
    // 기다리는 사이 앱이 뒤로 갔다 돌아오면 그때 받는다
    const handleVisible = () => {
      if (getNow() >= waitUntil) loadWhenVisible();
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

    // 마지막 카드를 넘기면 다음 피드를 받는다
    if (currentIndex + 1 >= cards.length) moveToNextFeed();

    if (action === 'wish') {
      increaseWishCount();

      // 찜은 발급이 아니라는 걸 화면에 들어온 뒤 첫 찜에서 한 번만 알려준다. 받을 수 있는 때는 카드 아래 안내와 맞춘다
      // 한 줄에 다 들어가지 않아, 어색하게 끊기지 않도록 받는 때를 둘째 줄에 둔다
      if (!hasShownWishToast.current) {
        hasShownWishToast.current = true;
        setToastMessage(
          `찜 목록에 담았어요\n${WISH_ISSUE_TIMING[getIssuePhase()]}`,
        );
      }
    }
  };

  const { cardProps, direction, swipe } = useSwipeGesture({
    onSwipe: handleSwipe,
    // 카드를 누르면 가게 상세로 간다. 돌아오면 보던 카드부터 이어 본다 (저장해 둔 묶음)
    onTap: () => {
      if (topCard) navigate(`/stores/${topCard.storeId}`);
    },
  });

  // 카드 자리를 보여주는지. 카드를 보다가 받는 중이면 카드 자리를 그대로 둔다
  // 처음 들어올 때는 응답이 늦어 회색 틀을 띄울 때만 카드 자리를 그린다. 그 전에는 필터 줄만 위에 둔다
  const isLoadingAsMessage = status === 'loading' && loadingView === 'message';
  const hasCardArea =
    (status === 'loading' &&
      (loadingView === 'cards' ||
        (loadingView === 'initial' && showPosterSkeleton))) ||
    Boolean(topCard);
  // 카드 바로 위 줄. 왼쪽은 피드에 거는 필터("필터"라고 적어 처음 보는 사람도 알 수 있게 한다)
  // 오른쪽은 11:00 오픈까지 남은 시간. 오픈 뒤에는 비워 둔다
  // 필터 때문에 카드가 없을 수도 있어, 카드가 없는 화면에도 둔다. 위치가 없을 때만 위치 설정이 먼저라 뺀다
  const filterRow = (
    <div className="flex items-center justify-between gap-3">
      <FeedFilterButton
        filter={feedFilter.filter}
        hasLoadError={feedFilter.hasLoadError}
        onLoadError={() => setToastMessage('필터를 불러오지 못했어요')}
        onReload={feedFilter.reload}
        onSaved={handleFilterSaved}
      />
      <OpenCountdown />
    </div>
  );

  return (
    <>
      <AppHeader locationName={locationName} wishCount={wishCount} />
      {/* 토스트를 헤더 바로 아래에 띄우기 위한 기준 영역 */}
      <div className="relative flex flex-1 flex-col">
        {toastMessage && (
          <div className="absolute inset-x-0 top-0 z-20 px-page pt-3">
            <FeedbackToast message={toastMessage} />
          </div>
        )}
        {/* 카드가 없는 화면(빈 화면, 기다리는 중)에서는 필터 줄을 맨 위에 둔다. 카드가 있으면 카드 묶음 안에 둔다 */}
        {status !== 'needsLocation' && !hasCardArea && (
          <div className="px-page pt-1">{filterRow}</div>
        )}
        {(status === 'empty' ||
          status === 'needsLocation' ||
          status === 'error') && (
          <SwipeUnavailable
            isClearingFilter={isClearingCategories}
            onRetry={retry}
            onShowAllCategories={
              hasCategoryFilter ? showAllCategories : undefined
            }
            reason={status}
          />
        )}
        {status === 'done' && <SwipeDone />}
        {/* 기다림·빈 화면에서 다시 받는 동안에도 같은 화면에 "새 카드를 불러오고 있어요"만 띄운다 */}
        {(status === 'waiting' || isLoadingAsMessage) && (
          <SwipeWaiting until={status === 'waiting' ? waitUntil : 0} />
        )}
        {/* 불러오는 중에는 카드 자리에 회색 틀을 보여준다 */}
        {hasCardArea && (
          // 날아가는 카드 때문에 가로 스크롤이 생기지 않도록 잘라낸다
          <section
            className="relative flex flex-1 flex-col overflow-x-clip px-page pt-1 pb-2"
            ref={setCardArea}
          >
            {/* 필터 줄, 카드, 버튼을 한 묶음으로 남는 높이의 세로 가운데에 둔다 */}
            {/* 필터와 남은 시간이 이 카드에 걸린다는 게 보이도록 카드 바로 위에 붙이고, 남는 높이는 위아래로 나눈다 */}
            {/* PC처럼 화면이 낮으면 포스터가 A4 비율을 지키도록 묶음 폭을 줄인다 */}
            <div
              className="@container relative mx-auto flex w-full flex-1 flex-col justify-center"
              style={{ maxWidth: cardMaxWidth }}
            >
              <div className="mb-2">{filterRow}</div>
              {/* 카드는 남는 높이만큼 늘어나되, 포스터가 점주 화면과 같은 A4(210:297, 141.43cqw)보다 길어지지 않게 한다 */}
              <div className="relative flex max-h-[141.43cqw] flex-1 flex-col">
                {/* 응답이 빠르면 회색 틀이 잠깐 나왔다 사라져 번쩍이므로, 조금 기다린 뒤에만 보여준다 */}
                {!topCard && (
                  <>
                    {showPosterSkeleton && <PosterSkeleton />}
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
              <div className="mt-2">
                <GestureRail
                  direction={direction}
                  disabled={!topCard}
                  onPass={() => swipe('pass')}
                  onWish={() => swipe('wish')}
                  storeName={topCard?.storeName}
                />
              </div>
              <SwipeHint />
            </div>
          </section>
        )}
      </div>
    </>
  );
};

export default SwipeFeed;
