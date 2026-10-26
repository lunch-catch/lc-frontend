import { useState } from 'react';

/** 같은 검색 조건의 페이지 이동 중에만 마지막 전체 건수를 유지한다. */
export const usePaginationTotal = (
  total: number | undefined,
  loading: boolean,
  query: string | null,
  owner: object | null,
  load: object,
) => {
  const filters = new URLSearchParams(query ?? '');
  // 행의 위치·개수·순서는 바뀌어도 검색 대상의 전체 건수는 같다.
  for (const key of ['page', 'size', 'sortBy', 'sortDir']) filters.delete(key);
  filters.sort();
  const key = filters.toString();
  const [previous, setPrevious] = useState<{
    key: string;
    owner: object;
    load: object;
    total: number;
  } | null>(null);
  if (
    query !== null &&
    owner &&
    total !== undefined &&
    (previous?.key !== key ||
      previous.owner !== owner ||
      previous.load !== load ||
      previous.total !== total)
  ) {
    setPrevious({ key, owner, load, total });
  }
  if (query === null || !owner) return undefined;
  if (total !== undefined) return total;
  // 이전 계정·다른 API의 건수나 오류 뒤의 건수를 정상 결과처럼 노출하지 않는다.
  if (
    loading &&
    previous?.key === key &&
    previous.owner === owner &&
    previous.load === load
  )
    return previous.total;
  return undefined;
};
