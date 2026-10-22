import { ApiError, requestData } from './client';

export type PointLedgerType =
  'CHARGE' | 'RESERVE' | 'DEDUCT' | 'RELEASE' | 'ADJUST' | 'REFUND';

export interface PointLedgerItem {
  ledgerId: number;
  ownerId: number;
  entryType: PointLedgerType;
  balanceBefore: number;
  amount: number;
  balanceAfter: number;
  campaignId: number | null;
  serveId: string | null;
  pgTid: string | null;
  source: 'REALTIME' | 'RECONCILIATION' | 'MANUAL';
  reason: string | null;
  createdAt: string;
}

export interface PointLedgerPage {
  items: PointLedgerItem[];
  nextPageToken: string | null;
}

// pageToken은 서버가 만든 불투명 토큰이므로 해석하거나 직접 조합하지 않고 그대로 전달한다.
export const getPointLedger = async (query: string, signal: AbortSignal) => {
  const data = await requestData<PointLedgerPage>(
    `/v1/admin/point-ledger?${query}`,
    { signal },
    200,
  );
  // 마지막 페이지도 nextPageToken: null을 반환해야 한다. 필드 누락을 마지막 페이지로 간주하지 않는다.
  if (
    !Array.isArray(data.items) ||
    (data.nextPageToken !== null && typeof data.nextPageToken !== 'string')
  ) {
    throw new ApiError('포인트 원장 응답 형식을 확인할 수 없습니다.', 200);
  }
  return data;
};
