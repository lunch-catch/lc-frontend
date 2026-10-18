import { useCallback, useEffect, useState } from 'react';

import type { AnalyticsQuery } from '@admin/api/analytics';
import { ApiError } from '@admin/api/client';
import { useAdminAuth } from '@admin/auth/useAdminAuth';

export const useAnalyticsQuery = <T>(
  load: (query: AnalyticsQuery, signal: AbortSignal) => Promise<T>,
  query: AnalyticsQuery | null,
) => {
  const { admin } = useAdminAuth();
  const [revision, setRevision] = useState(0);
  const [result, setResult] = useState<{
    key: string;
    data?: T;
    error?: string;
  } | null>(null);
  const retry = useCallback(() => setRevision((value) => value + 1), []);
  const from = query?.from;
  const to = query?.to;
  const period = query?.period;
  const key =
    query && admin
      ? JSON.stringify([admin.adminId, period, from, to, revision])
      : null;

  useEffect(() => {
    if (!key || !from || !to || !period) return;
    const controller = new AbortController();
    void load({ period, from, to }, controller.signal).then(
      (data) => {
        if (!controller.signal.aborted) setResult({ key, data });
      },
      (cause: unknown) => {
        if (!controller.signal.aborted)
          setResult({
            key,
            error:
              cause instanceof ApiError && cause.code === 'ANALYTICS-001'
                ? '조회 기간과 집계 단위를 확인해 주세요.'
                : cause instanceof ApiError
                  ? cause.message
                  : '집계 데이터를 불러오지 못했습니다.',
          });
      },
    );
    return () => controller.abort();
  }, [key, from, to, period, load]);
  // 조건이나 계정이 바뀌면 이전 응답을 새 조건의 수치로 표시하지 않는다.
  const current = result?.key === key ? result : null;
  return {
    data: current?.data,
    error: current?.error,
    loading: key !== null && !current,
    retry,
  };
};
