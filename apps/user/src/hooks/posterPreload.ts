import {
  type FeedCard,
  type FeedResponse,
  fetchFeed,
  fetchPosterHtml,
} from '@user/api/feed';

// 첫 카드를 기다려 주는 최대 시간(ms). 이 시간이 지나면 덜 받았어도 카드를 보여준다
const MAX_WAIT_MS = 1500;
// 피드가 도착하자마자 포스터를 받아 두는 카드 수. 맨 앞 카드와 그 뒤 두 장이다 (화면이 미리 그려 두는 수와 같다)
const PRELOAD_CARD_COUNT = 3;

// 포스터 HTML 안의 이미지 주소. 점주 포스터는 이미지를 주소로 넣는다
const IMAGE_SRC = /<img\b[^>]*?\bsrc\s*=\s*["'](https?:\/\/[^"']+)["']/gi;

// 받는 동안 이미지 객체가 치워져 요청이 끊기지 않도록 잡아 둔다
const loadingImages = new Set<HTMLImageElement>();

const preloadImage = (src: string) =>
  new Promise<void>((resolve) => {
    const image = new Image();
    const done = () => {
      loadingImages.delete(image);
      resolve();
    };
    image.onload = done;
    image.onerror = done;
    loadingImages.add(image);
    image.src = src;
  });

// 포스터 HTML을 받고, 그 안의 이미지까지 브라우저 캐시에 받아 둔다. 실패해도 카드는 그려야 하므로 조용히 끝난다
// 포스터 HTML은 카드가 쓰는 캐시(fetchPosterHtml)를 그대로 써서 같은 요청을 두 번 보내지 않는다
const preloadPoster = async (posterUrl: string) => {
  try {
    const html = await fetchPosterHtml(posterUrl);
    const sources = new Set(
      [...html.matchAll(IMAGE_SRC)].flatMap((match) =>
        match[1] ? [match[1]] : [],
      ),
    );
    await Promise.all([...sources].map(preloadImage));
  } catch {
    // 받지 못한 포스터는 카드가 따로 받아 보거나 대신 포스터를 보여준다
  }
};

// 피드가 도착하면 첫 카드들의 포스터와 이미지를 한꺼번에 받아 두고, 맨 앞 카드가 준비되면 끝난다
// 준비되기 전에 카드를 그리면 회색, 글자, 이미지가 차례로 나타나 화면이 번쩍여 보인다
// 맨 앞 카드만 기다리고 뒤 카드는 받으면서 먼저 보여준다. 너무 늦으면 기다리지 않고 보여준다
export const preparePosters = (cards: FeedCard[]) => {
  const [first, ...rest] = cards.slice(0, PRELOAD_CARD_COUNT);
  rest.forEach((card) => void preloadPoster(card.posterUrl));
  if (!first) return Promise.resolve();

  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<void>((resolve) => {
    timer = setTimeout(resolve, MAX_WAIT_MS);
  });

  return Promise.race([preloadPoster(first.posterUrl), timeout]).finally(() =>
    clearTimeout(timer),
  );
};

// 피드를 받고 첫 카드들의 포스터와 이미지까지 받아 둔다. 준비되면 응답을 그대로 돌려준다
export const fetchPreparedFeed = () =>
  fetchFeed().then(async (response) => {
    if (response.status === 'serving') await preparePosters(response.cards);
    return response;
  });

// 로그인이나 온보딩을 마친 직후에 받아 둔 첫 피드. 스와이프 화면이 열리면 이어받아 쓴다
// 이어받기 전에 오래 두면 카드를 받은 시각이 멀어져(노출 인정 30분) 쓰지 않고 버린다
const PREFETCHED_MAX_AGE_MS = 60_000;
// 받아 두기를 기다려 주는 최대 시간(ms). 넘으면 기다리지 않고 이동하고, 받던 요청은 스와이프 화면이 이어받는다
const PREFETCH_WAIT_MS = 2500;

let prefetchedFeed: {
  promise: Promise<FeedResponse>;
  startedAt: number;
} | null = null;

const getFreshPrefetchedFeed = () =>
  prefetchedFeed &&
  Date.now() - prefetchedFeed.startedAt < PREFETCHED_MAX_AGE_MS
    ? prefetchedFeed
    : null;

// 스와이프 화면이 열리기 전에 첫 피드를 받기 시작한다. 이미 받는 중이면 새로 보내지 않는다
// 실패하면 기억하지 않아, 스와이프 화면이 직접 다시 받아 본다
export const startFeedPrefetch = () => {
  const existing = getFreshPrefetchedFeed();
  if (existing) return existing.promise;

  const promise = fetchPreparedFeed();
  prefetchedFeed = { promise, startedAt: Date.now() };
  promise.catch(() => {
    if (prefetchedFeed?.promise === promise) prefetchedFeed = null;
  });
  return promise;
};

// 받아 둔 첫 피드를 이어받는다. 없거나 오래됐으면 null
// 개발 모드에서 화면이 두 번 그려질 때 같은 응답을 둘 다 받을 수 있도록, 쓴 뒤에 clearPrefetchedFeed로 지운다
export const getPrefetchedFeed = () =>
  getFreshPrefetchedFeed()?.promise ?? null;

export const clearPrefetchedFeed = () => {
  prefetchedFeed = null;
};

// 첫 피드를 받아 두고 기다린다. 이동하기 전 "로그인 중" 같은 화면이 떠 있는 자리에서 쓴다
// 받지 못해도, 너무 오래 걸려도 이동을 막지 않는다
export const prefetchFirstFeed = async () => {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<void>((resolve) => {
    timer = setTimeout(resolve, PREFETCH_WAIT_MS);
  });
  try {
    await Promise.race([startFeedPrefetch().then(() => undefined), timeout]);
  } catch {
    // 스와이프 화면이 직접 다시 받는다
  } finally {
    clearTimeout(timer);
  }
};
