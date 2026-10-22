import type { LedgerType } from './billingTypes';
export const ledgerTypeLabels: Record<LedgerType, string> = {
  CHARGE: '충전',
  RESERVE: '예약',
  DEDUCT: '소진',
  RELEASE: '예약 해제',
  ADJUST: '조정',
  REFUND: '환불',
};
export const getKoreaDate = (date = new Date()) =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
export const inDateRange = (timestamp: string, start: string, end: string) =>
  (!start || timestamp.slice(0, 10) >= start) &&
  (!end || timestamp.slice(0, 10) <= end);
