import { request } from './client';
import type { BusinessCategory } from './store';

// 피드 정렬. DISTANCE: 거리순, DISCOUNT_RATE: 할인율순
export type FeedSort = 'DISTANCE' | 'DISCOUNT_RATE';

// 내 피드 필터 (GET·PUT /v1/feed-filter)
// 업종이 빈 배열이면 전체 업종이다. 계정에 저장돼 다시 접속해도 유지되고, 다음 피드 요청부터 적용된다
export interface FeedFilter {
  categories: BusinessCategory[];
  sort: FeedSort;
}

// 저장한 적이 없을 때 서버가 돌려주는 값
export const DEFAULT_FEED_FILTER: FeedFilter = {
  categories: [],
  sort: 'DISTANCE',
};

// 피드 필터는 서버 구현이 끝나 실제 API를 쓴다
const USE_FEED_FILTER_API = true;

const MOCK_DELAY_MS = 400;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// mock 단계에서 저장한 필터. 새로고침하면 처음 값으로 돌아간다
let mockFilter: FeedFilter = DEFAULT_FEED_FILTER;

export const fetchFeedFilter = async (): Promise<FeedFilter> => {
  if (USE_FEED_FILTER_API) return request<FeedFilter>('/v1/feed-filter');

  await wait(MOCK_DELAY_MS);
  return mockFilter;
};

// 필터를 통째로 바꾼다. 업종 필터는 카드 10장 전부에, 정렬은 추천 카드 7장에만 적용된다 (서버 처리)
export const saveFeedFilter = async (
  filter: FeedFilter,
): Promise<FeedFilter> => {
  if (USE_FEED_FILTER_API) {
    return request<FeedFilter>('/v1/feed-filter', {
      method: 'PUT',
      body: filter,
    });
  }

  await wait(MOCK_DELAY_MS);
  mockFilter = filter;
  return mockFilter;
};
