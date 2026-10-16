import { useCallback, useEffect, useState } from 'react';

import { useAdminAuth } from '@admin/auth/useAdminAuth';

import { getBillingManagementError } from './billingManagementUtils';

/** query가 null이면 조회를 보류하며, 조건·계정이 달라진 이전 응답은 표시하지 않는다. */
export const useBillingResource = <T>(
  load: (query: string, signal: AbortSignal) => Promise<T>,
  query: string | null,
) => {
  const { admin } = useAdminAuth();
  const adminId = admin?.adminId;
  const [revision, setRevision] = useState(0);
  const [result, setResult] = useState<{
    key: string;
    data?: T;
    error?: string;
  } | null>(null);
  const refresh = useCallback(() => setRevision((value) => value + 1), []);
  const key =
    query === null || adminId === undefined
      ? null
      : JSON.stringify([adminId, query, revision]);
  useEffect(() => {
    if (key === null || query === null) return;
    const controller = new AbortController();
    void load(query, controller.signal).then(
      (data) => {
        if (!controller.signal.aborted) setResult({ key, data });
      },
      (error) => {
        if (!controller.signal.aborted)
          setResult({ key, error: getBillingManagementError(error) });
      },
    );
    return () => controller.abort();
  }, [key, load, query]);
  const current = key !== null && result?.key === key ? result : null;
  return {
    data: current?.data,
    error: current?.error,
    loading: key !== null && !current,
    refresh,
  };
};
