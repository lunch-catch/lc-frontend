import { useEffect, useState } from 'react';

import { ApiError } from '@admin/api/client';
import {
  getPointSummary,
  type PointSummary,
  type PointSummaryPeriod,
} from '@admin/api/pointSummary';

interface PointSummaryFilters {
  ownerId: string;
  period: PointSummaryPeriod;
  from: string;
  to: string;
}

interface PointSummaryResult {
  key: string;
  data?: PointSummary;
  error?: string;
}

export const usePointSummary = (
  filters: PointSummaryFilters | null,
  sortDir: 'asc' | 'desc' = 'desc',
) => {
  const [revision, setRevision] = useState(0);
  const [result, setResult] = useState<PointSummaryResult | null>(null);
  const enabled = filters !== null;
  const query = filters
    ? new URLSearchParams({ ...filters, sortDir }).toString()
    : '';
  const key = JSON.stringify([query, revision]);

  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    void getPointSummary(query, controller.signal).then(
      (data) => {
        if (!controller.signal.aborted) setResult({ key, data });
      },
      (error: unknown) => {
        if (!controller.signal.aborted)
          setResult({
            key,
            error:
              error instanceof ApiError
                ? error.message
                : '서버에 연결하지 못했습니다.',
          });
      },
    );
    return () => controller.abort();
  }, [enabled, key, query]);

  // 점주나 조회 조건이 바뀌면 이전 합계를 숨겨 다른 점주의 금액이 섞이지 않게 한다.
  const current = result?.key === key && enabled ? result : null;
  return {
    data: current?.data,
    error: current?.error,
    loading: enabled && !current,
    enabled,
    sortDir,
    retry: () => setRevision((value) => value + 1),
  };
};
