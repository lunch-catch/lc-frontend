import { ApiError, requestData } from './client';

export type PointSummaryPeriod = 'DAILY' | 'WEEKLY' | 'MONTHLY';

export interface PointSummaryItem {
  label: string;
  chargeAmount: number;
  spentAmount: number;
  reservedAmount: number;
  releasedAmount: number;
  refundAmount: number;
  adjustAmount: number;
}

export interface PointSummary {
  ownerId: number;
  period: PointSummaryPeriod;
  from: string;
  to: string;
  items: PointSummaryItem[];
}

export const getPointSummary = async (
  query: string,
  signal: AbortSignal,
): Promise<PointSummary> => {
  const data = await requestData<PointSummary>(
    `/v1/admin/point-ledger/summary?${query}`,
    { signal },
    200,
  );
  const amountKeys = [
    'chargeAmount',
    'spentAmount',
    'reservedAmount',
    'releasedAmount',
    'refundAmount',
    'adjustAmount',
  ] as const;
  if (
    !Number.isSafeInteger(data.ownerId) ||
    data.ownerId <= 0 ||
    !['DAILY', 'WEEKLY', 'MONTHLY'].includes(data.period) ||
    typeof data.from !== 'string' ||
    typeof data.to !== 'string' ||
    !Array.isArray(data.items) ||
    data.items.some(
      (item) =>
        !item ||
        typeof item.label !== 'string' ||
        amountKeys.some((key) => !Number.isSafeInteger(item[key])),
    )
  )
    throw new ApiError('포인트 합계 응답 형식을 확인할 수 없습니다.', 200);
  return data;
};
