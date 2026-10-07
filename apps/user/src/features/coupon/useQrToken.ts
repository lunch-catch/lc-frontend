import { useEffect, useState } from 'react';

import { fetchQrToken, type QrToken } from '@user/api/coupon';

// QR을 보여줄 수 있는 동안 60초짜리 QR 토큰을 받고, 시간이 다 되면 새로 받는다
// 연결이 끊긴 동안에는 받지 않고 마지막 토큰을 그대로 둔다
export const useQrToken = (issueId: string, enabled: boolean, now: number) => {
  const [token, setToken] = useState<QrToken | null>(null);
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const needsToken = enabled && isOnline && (!token || token.expiresAt <= now);

  useEffect(() => {
    if (!needsToken) return;

    let ignore = false;
    fetchQrToken(issueId).then((nextToken) => {
      if (!ignore) setToken(nextToken);
    });

    // 응답 전에 화면을 벗어나면 결과를 버린다
    return () => {
      ignore = true;
    };
  }, [issueId, needsToken]);

  return { isOnline, token };
};
