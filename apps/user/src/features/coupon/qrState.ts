import { getTodayAt } from '@user/api/clock';
import type { Coupon, QrToken } from '@user/api/coupon';

// QR 화면이 보여줄 상태
export type QrState =
  | 'beforeUse'
  | 'active'
  | 'urgent'
  | 'refreshing'
  | 'offline'
  | 'used'
  | 'expired';

// QR이 바뀌기 10초 전부터 서두르라고 알려준다
export const QR_URGENT_MS = 10_000;

interface QrStateInput {
  coupon: Coupon;
  now: number;
  token: QrToken | null;
  isOnline: boolean;
}

// 앞에 있는 조건이 먼저다. 쓸 수 없는 쿠폰인지부터 보고, 쓸 수 있으면 QR이 준비됐는지 본다
export const getQrState = ({
  coupon,
  isOnline,
  now,
  token,
}: QrStateInput): QrState => {
  if (coupon.status === 'used') return 'used';
  if (coupon.status === 'expired' || now >= Date.parse(coupon.expiresAt)) {
    return 'expired';
  }
  if (now < getTodayAt(coupon.usableFrom, now)) return 'beforeUse';
  // 연결이 끊기면 새 QR을 받을 수 없어 마지막 QR의 남은 시간만 보여준다
  if (!isOnline) return 'offline';
  if (!token || token.expiresAt <= now) return 'refreshing';
  if (token.expiresAt - now <= QR_URGENT_MS) return 'urgent';
  return 'active';
};
