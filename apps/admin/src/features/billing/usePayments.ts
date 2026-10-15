import { useCallback, useEffect, useState } from 'react';

import { getPayments, type PaymentPage } from '@admin/api/payments';

import { getPaymentError } from './paymentUtils';

interface PaymentResult {
  key: string;
  data?: PaymentPage;
  error?: string;
}

/** null 조건은 조회를 중지하고, refresh는 같은 조건에서도 서버 목록을 다시 읽는다. */
export const usePayments = (query: string | null) => {
  const [revision, setRevision] = useState(0);
  const [result, setResult] = useState<PaymentResult | null>(null);
  const refresh = useCallback(() => setRevision((value) => value + 1), []);
  const key = query === null ? null : JSON.stringify([query, revision]);

  useEffect(() => {
    if (query === null || key === null) return;
    const controller = new AbortController();
    void getPayments(query, controller.signal).then(
      (data) => {
        if (!controller.signal.aborted) setResult({ key, data });
      },
      (error: unknown) => {
        if (!controller.signal.aborted)
          setResult({ key, error: getPaymentError(error) });
      },
    );
    return () => controller.abort();
  }, [query, key]);

  // 조건 변경·재조회 뒤에는 이전 목록을 숨기고, 늦게 도착한 응답도 표시하지 않는다.
  const current = key !== null && result?.key === key ? result : null;
  return {
    data: current?.data,
    error: current?.error,
    loading: key !== null && !current,
    refresh,
  };
};
