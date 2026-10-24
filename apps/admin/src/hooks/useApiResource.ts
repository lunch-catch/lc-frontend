import { useCallback, useEffect, useMemo, useState } from 'react';

import { ApiError } from '@admin/api/client';
import { useAdminAuth } from '@admin/auth/useAdminAuth';

import { apiResourceCache } from './apiResourceCache';

const getResourceError = (cause: unknown) =>
  cause instanceof ApiError ? cause.message : '데이터를 불러오지 못했습니다.';

/** query가 null이면 조회를 보류하고, 조건·계정이 바뀌면 이전 결과를 숨긴다. */
// load와 formatError는 참조가 바뀌면 다시 조회하므로 모듈 함수나 useCallback으로 고정한다.
export const useApiResource = <T>(
  load: (query: string, signal: AbortSignal) => Promise<T>,
  query: string | null,
  formatError: (cause: unknown) => string = getResourceError,
  { cache = true }: { cache?: boolean } = {},
) => {
  const { admin } = useAdminAuth();
  const [revision, setRevision] = useState(0);
  const [result, setResult] = useState<{
    key: string;
    owner: object;
    load: object;
    data?: T;
    error?: string;
  } | null>(null);
  const refresh = useCallback(() => {
    if (admin) apiResourceCache.invalidate(admin, load);
    setRevision((value) => value + 1);
  }, [admin, load]);
  const key =
    query === null || !admin
      ? null
      : JSON.stringify([admin.adminId, query, revision]);
  // 캐시 스냅샷은 이 조회 조건의 수명 동안 유지해 TTL 만료가 화면을 다시 로딩으로 바꾸지 않는다.
  const cached = useMemo<{ data?: T; error?: string } | undefined>(() => {
    return cache && key !== null && admin && query !== null
      ? apiResourceCache.read<T>(admin, load, query)
      : undefined;
  }, [key, admin, load, query, cache]);
  useEffect(() => {
    if (key === null || query === null || !admin || cached) return;
    const controller = new AbortController();
    const cacheRevision = apiResourceCache.revision(admin, load);
    void load(query, controller.signal).then(
      (data) => {
        if (!controller.signal.aborted) {
          // 새로고침 이전에 시작한 응답은 화면에 반영하더라도 캐시를 되살리지 않는다.
          if (cache && apiResourceCache.revision(admin, load) === cacheRevision)
            apiResourceCache.write(admin, load, query, data);
          setResult({ key, owner: admin, load, data });
        }
      },
      (cause: unknown) => {
        if (!controller.signal.aborted)
          setResult({
            key,
            owner: admin,
            load,
            error: formatError(cause),
          });
      },
    );
    // 취소를 무시하고 완료되는 요청도 위의 signal 검사로 이전 결과 반영을 막는다.
    return () => controller.abort();
  }, [key, query, load, formatError, admin, cached, cache]);
  const current =
    key !== null &&
    result?.key === key &&
    result.owner === admin &&
    result.load === load
      ? result
      : cached;
  return {
    enabled: key !== null,
    data: current?.data,
    error: current?.error,
    loading: key !== null && !current,
    refresh,
  };
};
