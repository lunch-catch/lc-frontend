import { useCallback, useEffect, useState } from 'react';

import type { AnalyticsQuery } from '@admin/api/analytics';
import { ApiError } from '@admin/api/client';
import { useAdminAuth } from '@admin/auth/useAdminAuth';

export const useAnalyticsQuery = <T>(
  load: (query: AnalyticsQuery, signal: AbortSignal) => Promise<T>,
  query: AnalyticsQuery | null,
) => {
  const { admin } = useAdminAuth();
  const adminId = admin?.adminId;
  const [revision, setRevision] = useState(0);
  const [cache, setCache] = useState<{
    adminId: number;
    entries: Map<string, { data?: T; error?: string }>;
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
    if (!key || !from || !to || !period || adminId === undefined) return;
    const save = (entry: { data?: T; error?: string }) => {
      setCache((previous) => {
        const entries = new Map(
          previous?.adminId === adminId ? previous.entries : [],
        );
        entries.delete(key);
        entries.set(key, entry);
        // 최근 조건만 보관해 기간 선택·재시도로 메모리가 계속 늘어나지 않게 한다.
        if (entries.size > 8) {
          const oldest = entries.keys().next().value;
          if (oldest !== undefined) entries.delete(oldest);
        }
        return { adminId, entries };
      });
    };
    const controller = new AbortController();
    void load({ period, from, to }, controller.signal).then(
      (data) => {
        if (!controller.signal.aborted) save({ data });
      },
      (cause: unknown) => {
        if (!controller.signal.aborted)
          save({
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
  }, [key, from, to, period, load, adminId]);
  // 같은 계정·조건의 결과만 재사용하며, 다시 진입하면 백그라운드에서 최신 값으로 갱신한다.
  const current =
    key !== null && cache !== null && cache.adminId === adminId
      ? cache.entries.get(key)
      : undefined;
  return {
    data: current?.data,
    error: current?.error,
    loading: key !== null && !current,
    retry,
  };
};
