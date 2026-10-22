import { useEffect, useState } from 'react';

import { getNow } from '@user/api/clock';
import { fetchQrToken, type QrToken } from '@user/api/coupon';

// QR을 보여줄 수 있는 동안 60초짜리 QR을 받고, 시간이 다 되면 새로 받는다
// 연결이 끊긴 동안에는 받지 않고 마지막 QR을 그대로 둔다
// 받지 못하면 멈추고 다시 시도를 기다린다. 이미 사용했거나 사용 시간이 아니면 쿠폰 상태 확인(useLatestCoupon)이 화면을 바꾼다
export const useQrToken = (
  memberCouponId: number,
  enabled: boolean,
  now: number,
) => {
  const [token, setToken] = useState<QrToken | null>(null);
  const [hasFailed, setHasFailed] = useState(false);
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

  const needsToken =
    enabled && isOnline && !hasFailed && (!token || token.expiresAt <= now);

  useEffect(() => {
    if (!needsToken) return;

    let ignore = false;
    fetchQrToken(memberCouponId)
      .then((nextToken) => {
        if (ignore) return;
        // 응답이 늦게 와 이미 만료된 QR이면 다시 받기를 기다린다
        // 만료된 QR을 저장하면 받을 조건이 그대로라 다시 요청하지 않고 새로 받는 중에 멈춘다
        if (nextToken.expiresAt <= getNow()) {
          setHasFailed(true);
          return;
        }
        setToken(nextToken);
      })
      .catch(() => {
        if (!ignore) setHasFailed(true);
      });

    // 응답 전에 화면을 벗어나면 결과를 버린다
    return () => {
      ignore = true;
    };
  }, [memberCouponId, needsToken]);

  const retry = () => setHasFailed(false);

  return { hasFailed, isOnline, retry, token };
};
