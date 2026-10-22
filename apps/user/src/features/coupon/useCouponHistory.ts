import { useCallback, useEffect, useRef, useState } from 'react';

import {
  type Coupon,
  type CouponFilter,
  fetchCouponPage,
} from '@user/api/coupon';

const PAGE_SIZE = 20;

interface HistoryState {
  // 불러온 쿠폰. 첫 페이지를 받기 전이면 undefined, 첫 페이지를 못 받았으면 null
  items: Coupon[] | null | undefined;
  nextPageToken: string | null;
  isLoadingMore: boolean;
  // 다음 페이지를 받지 못했는지. 다시 시도하면 이어서 받는다
  hasMoreError: boolean;
}

const initialState: HistoryState = {
  items: undefined,
  nextPageToken: null,
  isLoadingMore: false,
  hasMoreError: false,
};

// 사용 내역을 한 페이지(20개)씩 받는다. 계속 쌓이는 목록이라 한 번에 다 받지 않는다
// 필터를 바꾸면 명세대로 첫 페이지부터 다시 받는다
export const useCouponHistory = (filter: CouponFilter | undefined) => {
  const [state, setState] = useState<HistoryState>(initialState);
  // 다시 시도할 때마다 올려서 첫 페이지를 새로 받는다
  const [attempt, setAttempt] = useState(0);
  // 필터를 바꾸거나 다시 시도하면 올린다. 그 전에 보낸 요청의 응답은 버린다
  const generation = useRef(0);

  useEffect(() => {
    const current = ++generation.current;

    fetchCouponPage({ filter, pageSize: PAGE_SIZE })
      .then((page) => {
        if (current !== generation.current) return;
        setState({
          ...initialState,
          items: page.items,
          nextPageToken: page.nextPageToken,
        });
      })
      .catch(() => {
        if (current === generation.current) {
          setState({ ...initialState, items: null });
        }
      });
  }, [filter, attempt]);

  // 필터를 바꿀 때 부른다. 이전 목록 대신 불러오는 중을 보여준다
  const reset = () => setState(initialState);

  const retry = () => {
    setState(initialState);
    setAttempt((value) => value + 1);
  };

  const { hasMoreError, isLoadingMore, items, nextPageToken } = state;

  const loadMore = useCallback(() => {
    if (!items || !nextPageToken || isLoadingMore) return;

    const current = generation.current;
    setState((prev) => ({ ...prev, isLoadingMore: true, hasMoreError: false }));

    fetchCouponPage({ filter, pageSize: PAGE_SIZE, pageToken: nextPageToken })
      .then((page) => {
        if (current !== generation.current) return;
        setState((prev) => ({
          ...prev,
          items: [...(prev.items ?? []), ...page.items],
          nextPageToken: page.nextPageToken,
          isLoadingMore: false,
        }));
      })
      .catch(() => {
        if (current !== generation.current) return;
        setState((prev) => ({
          ...prev,
          isLoadingMore: false,
          hasMoreError: true,
        }));
      });
  }, [filter, isLoadingMore, items, nextPageToken]);

  return {
    items,
    hasMore: nextPageToken !== null,
    hasMoreError,
    isLoadingMore,
    loadMore,
    reset,
    retry,
  };
};
