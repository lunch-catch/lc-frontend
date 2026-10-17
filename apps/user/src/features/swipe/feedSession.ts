import type { FeedCard } from '@user/api/feed';

// 지금 보고 있는 피드 묶음. 탭을 오가거나 새로고침해도 피드를 다시 받지 않고 보던 카드부터 이어 보게 저장한다
// 피드는 60초에 6회까지라 탭을 오갈 때마다 받으면 금방 막히고, 새로 받은 카드는 노출이 다시 기록된다
export interface FeedSession {
  cards: FeedCard[];
  // 지금 맨 위 카드의 순서. 카드 수와 같으면 모두 넘긴 것이다
  currentIndex: number;
  // 다음 피드를 받을 수 있는 시각 (이 휴대폰 시계 기준 ms). null이면 다음 피드가 없다
  nextFeedAt: number | null;
  // 이 묶음을 받은 시각 (이 휴대폰 시계 기준 ms)
  receivedAt: number;
}

// 탭을 닫으면 지워지고 다른 탭과 섞이지 않도록 sessionStorage에 둔다
const STORAGE_KEY = 'launch-catch-feed-session';

// 카드를 받은 지 30분이 지나면 서버가 노출을 무효로 본다 (명세의 노출 인정 시간). 그보다 오래된 묶음은 버린다
const MAX_AGE_MS = 30 * 60 * 1000;

const isSameDay = (a: number, b: number) =>
  new Date(a).toDateString() === new Date(b).toDateString();

// 저장한 묶음을 읽는다. 오래됐거나, 날짜가 바뀌었거나, 읽을 수 없으면 지우고 null
export const loadFeedSession = (): FeedSession | null => {
  try {
    const saved = window.sessionStorage.getItem(STORAGE_KEY);
    if (!saved) return null;

    const session = JSON.parse(saved) as FeedSession;
    const now = Date.now();
    const isValid =
      Array.isArray(session.cards) &&
      session.cards.length > 0 &&
      session.currentIndex >= 0 &&
      session.currentIndex <= session.cards.length &&
      now - session.receivedAt < MAX_AGE_MS &&
      isSameDay(now, session.receivedAt);

    if (isValid) return session;
  } catch {
    // 저장소를 쓸 수 없거나 값이 깨졌으면 새로 받는다
  }

  clearFeedSession();
  return null;
};

export const saveFeedSession = (session: FeedSession) => {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    // 저장소를 쓸 수 없으면 저장하지 않는다. 다음에 들어오면 새로 받는다
  }
};

// 노출을 이미 보낸 카드(serveId). 탭을 오가거나 새로고침해 같은 카드가 다시 보여도 노출을 또 보내지 않는다
// 서버도 같은 serveId는 처음 것만 기록하지만, 쓸데없는 요청을 줄인다
const IMPRESSION_STORAGE_KEY = 'launch-catch-feed-impressions';
// 피드 한 묶음이 10장이라 최근 몇 묶음만 기억하면 충분하다
const MAX_IMPRESSIONS = 50;

export const loadImpressedServeIds = (): string[] => {
  try {
    const saved = window.sessionStorage.getItem(IMPRESSION_STORAGE_KEY);
    const ids: unknown = saved ? JSON.parse(saved) : [];
    return Array.isArray(ids)
      ? ids.filter((id): id is string => typeof id === 'string')
      : [];
  } catch {
    return [];
  }
};

export const saveImpressedServeIds = (ids: Iterable<string>) => {
  try {
    window.sessionStorage.setItem(
      IMPRESSION_STORAGE_KEY,
      JSON.stringify([...ids].slice(-MAX_IMPRESSIONS)),
    );
  } catch {
    // 저장소를 쓸 수 없으면 저장하지 않는다. 서버가 중복을 걸러 준다
  }
};

// 요청 제한(429)으로 다시 요청할 수 있는 시각 (이 휴대폰 시계 기준 ms)
// 기다리는 중에 새로고침해도 바로 다시 요청하지 않고 이어서 기다리게 저장한다
const RATE_LIMIT_STORAGE_KEY = 'launch-catch-feed-retry-at';

// 저장한 시각이 아직 지나지 않았으면 돌려준다. 지났거나 없으면 지우고 null
export const loadRateLimitedUntil = (): number | null => {
  try {
    const until = Number(window.sessionStorage.getItem(RATE_LIMIT_STORAGE_KEY));
    if (Number.isFinite(until) && until > Date.now()) return until;
    window.sessionStorage.removeItem(RATE_LIMIT_STORAGE_KEY);
  } catch {
    // 저장소를 쓸 수 없으면 기다리지 않고 바로 요청한다
  }
  return null;
};

export const saveRateLimitedUntil = (until: number) => {
  try {
    window.sessionStorage.setItem(RATE_LIMIT_STORAGE_KEY, String(until));
  } catch {
    // 저장소를 쓸 수 없으면 저장하지 않는다
  }
};

export const clearRateLimitedUntil = () => {
  try {
    window.sessionStorage.removeItem(RATE_LIMIT_STORAGE_KEY);
  } catch {
    // 저장소를 쓸 수 없으면 지울 것도 없다
  }
};

export const clearFeedSession = () => {
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
    window.sessionStorage.removeItem(IMPRESSION_STORAGE_KEY);
  } catch {
    // 저장소를 쓸 수 없으면 지울 것도 없다
  }
};
