import { useCallback, useEffect, useState } from 'react';

import { ApiError } from '@admin/api/client';
import { getSettlementMismatches } from '@admin/api/settlementMismatches';
import { useAdminAuth } from '@admin/auth/useAdminAuth';

const pendingQuery = new URLSearchParams({
  resolved: 'false',
  page: '0',
  size: '1',
}).toString();

/** 분석 기간과 무관한 전체 미해결 건수를 조회하며, 계정 변경 시 이전 결과를 표시하지 않는다. */
export const usePendingSettlementCount = () => {
  const { admin } = useAdminAuth();
  const adminId = admin?.adminId;
  const [revision, setRevision] = useState(0);
  const [result, setResult] = useState<{
    key: string;
    count?: number;
    error?: string;
  } | null>(null);
  const refresh = useCallback(() => setRevision((value) => value + 1), []);
  const key =
    adminId === undefined ? null : JSON.stringify([adminId, revision]);

  useEffect(() => {
    if (key === null) return;
    const controller = new AbortController();
    void getSettlementMismatches(pendingQuery, controller.signal).then(
      (data) => {
        if (!controller.signal.aborted)
          setResult({ key, count: data.totalElements });
      },
      (cause: unknown) => {
        if (!controller.signal.aborted)
          setResult({
            key,
            error:
              cause instanceof ApiError
                ? cause.message
                : '미해결 정산 불일치를 불러오지 못했습니다.',
          });
      },
    );
    return () => controller.abort();
  }, [key]);

  const current = key !== null && result?.key === key ? result : null;
  return {
    count: current?.count,
    error: current?.error,
    loading: key !== null && !current,
    refresh,
  };
};
