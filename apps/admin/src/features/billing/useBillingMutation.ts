import { useEffect, useRef, useState } from 'react';

import { getBillingManagementError } from './billingManagementUtils';

/** 렌더링 전의 중복 클릭을 막고, 닫힌 화면에는 비동기 처리 결과를 반영하지 않는다. */
export const useBillingMutation = () => {
  const locked = useRef(false);
  const mounted = useRef(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const run = async <T>(
    action: () => Promise<T>,
    onSuccess: (value: T) => void,
    onError?: (cause: unknown) => void,
  ) => {
    if (locked.current) return;
    locked.current = true;
    setBusy(true);
    setError('');
    try {
      const value = await action();
      if (mounted.current) onSuccess(value);
    } catch (cause) {
      if (mounted.current) {
        setError(getBillingManagementError(cause));
        onError?.(cause);
      }
    } finally {
      locked.current = false;
      if (mounted.current) setBusy(false);
    }
  };
  return { busy, error, setError, run };
};
