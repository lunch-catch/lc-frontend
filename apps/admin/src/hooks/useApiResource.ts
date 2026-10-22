import { useCallback, useEffect, useState } from 'react';

import { ApiError } from '@admin/api/client';
import { useAdminAuth } from '@admin/auth/useAdminAuth';

const getResourceError = (cause: unknown) =>
  cause instanceof ApiError ? cause.message : '데이터를 불러오지 못했습니다.';

/** query가 null이면 조회를 보류하고, 조건·계정이 바뀌면 이전 결과를 숨긴다. */
// load와 formatError는 참조가 바뀌면 다시 조회하므로 모듈 함수나 useCallback으로 고정한다.
export const useApiResource = <T>(
  load: (query: string, signal: AbortSignal) => Promise<T>,
  query: string | null,
  formatError: (cause: unknown) => string = getResourceError,
) => {
  const { admin } = useAdminAuth();
  const [revision, setRevision] = useState(0);
  const [result, setResult] = useState<{
    key: string;
    data?: T;
    error?: string;
  } | null>(null);
  const refresh = useCallback(() => setRevision((value) => value + 1), []);
  const key =
    query === null || !admin
      ? null
      : JSON.stringify([admin.adminId, query, revision]);
  useEffect(() => {
    if (key === null || query === null) return;
    const controller = new AbortController();
    void load(query, controller.signal).then(
      (data) => {
        if (!controller.signal.aborted) setResult({ key, data });
      },
      (cause: unknown) => {
        if (!controller.signal.aborted)
          setResult({
            key,
            error: formatError(cause),
          });
      },
    );
    // 취소를 무시하고 완료되는 요청도 위의 signal 검사로 이전 결과 반영을 막는다.
    return () => controller.abort();
  }, [key, query, load, formatError]);
  const current = key !== null && result?.key === key ? result : null;
  return {
    enabled: key !== null,
    data: current?.data,
    error: current?.error,
    loading: key !== null && !current,
    refresh,
  };
};
