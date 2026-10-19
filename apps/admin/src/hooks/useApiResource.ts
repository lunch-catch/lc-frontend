import { useCallback, useEffect, useState } from 'react';

import { ApiError } from '@admin/api/client';
import { useAdminAuth } from '@admin/auth/useAdminAuth';

/** 조건·계정이 바뀌면 이전 목록을 숨기고 진행 중인 조회를 취소한다. */
export const useApiResource = <T>(
  load: (query: string, signal: AbortSignal) => Promise<T>,
  query: string | null,
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
            error:
              cause instanceof ApiError
                ? cause.message
                : '데이터를 불러오지 못했습니다.',
          });
      },
    );
    return () => controller.abort();
  }, [key, query, load]);
  const current = key !== null && result?.key === key ? result : null;
  return {
    data: current?.data,
    error: current?.error,
    loading: key !== null && !current,
    refresh,
  };
};
