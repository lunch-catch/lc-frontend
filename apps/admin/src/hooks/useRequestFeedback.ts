import { useCallback, useEffect, useState } from 'react';

import { ApiError } from '@admin/api/client';

export const useRequestFeedback = () => {
  const [errorMessage, setErrorMessage] = useState('');
  const [retryUntil, setRetryUntil] = useState(0);
  const [retryAfterSeconds, setRetryAfterSeconds] = useState(0);
  const isWaiting = retryUntil > 0;

  useEffect(() => {
    if (!retryUntil) return;
    const timer = window.setTimeout(
      () => {
        setRetryUntil(0);
        setRetryAfterSeconds(0);
      },
      Math.min(2147483647, Math.max(0, retryUntil - Date.now())),
    );
    const countdown = window.setInterval(() => {
      setRetryAfterSeconds(
        Math.max(0, Math.ceil((retryUntil - Date.now()) / 1000)),
      );
    }, 1000);
    return () => {
      window.clearTimeout(timer);
      window.clearInterval(countdown);
    };
  }, [retryUntil]);

  const reportError = useCallback((error: unknown) => {
    setErrorMessage(
      error instanceof ApiError
        ? error.message
        : '서버에 연결하지 못했습니다. 연결 상태를 확인한 뒤 다시 시도해 주세요.',
    );
    if (error instanceof ApiError && error.retryAfterSeconds) {
      setRetryUntil(Date.now() + error.retryAfterSeconds * 1000);
      setRetryAfterSeconds(error.retryAfterSeconds);
    }
  }, []);

  return {
    errorMessage,
    isWaiting,
    retryAfterSeconds,
    reportError,
    clearError: () => setErrorMessage(''),
  };
};
