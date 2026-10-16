import {
  billingJson,
  isBillingId,
  isBillingInteger,
  isBillingRecord,
  isBillingText,
  isOptionalBillingId,
  readBillingPage,
} from './billingResponse';
import { ApiError, requestData } from './client';

export type RefundStatus = 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
export interface AdminRefund {
  refundRequestId: number;
  ownerId: number;
  amount: number;
  fee: number | null;
  status: RefundStatus;
  reason: string | null;
  rejectReason: string | null;
  requestedAt: string;
  processedAt: string | null;
  processedBy: number | null;
  currentBalance: number;
  hasActiveCampaign: boolean;
}
interface RefundProcessed {
  refundRequestId: number;
  status: RefundStatus;
  amount: number;
  fee: number | null;
  processedAt: string;
}
const isStatus = (value: unknown) =>
  ['REQUESTED', 'APPROVED', 'REJECTED', 'COMPLETED'].includes(String(value));
const isFee = (value: unknown) =>
  value === null || (isBillingInteger(value) && value >= 0);
const isRefund = (value: unknown): value is AdminRefund =>
  isBillingRecord(value) &&
  isBillingId(value.refundRequestId) &&
  isBillingId(value.ownerId) &&
  isBillingId(value.amount) &&
  isFee(value.fee) &&
  isStatus(value.status) &&
  isBillingText(value.reason) &&
  isBillingText(value.rejectReason) &&
  typeof value.requestedAt === 'string' &&
  isBillingText(value.processedAt) &&
  isOptionalBillingId(value.processedBy) &&
  isBillingInteger(value.currentBalance) &&
  typeof value.hasActiveCampaign === 'boolean';

export const getRefunds = async (query: string, signal: AbortSignal) =>
  readBillingPage(
    await requestData<unknown>(
      `/v1/admin/refund-requests?${query}`,
      { signal },
      200,
    ),
    isRefund,
  );

/** 승인은 본문 없이 요청하며, 반려할 때만 점주에게 보이는 사유를 보낸다. */
export const processRefund = async (
  id: number,
  decision: 'approve' | 'reject',
  rejectReason?: string,
): Promise<RefundProcessed> => {
  const data = await requestData<unknown>(
    `/v1/admin/refund-requests/${id}:${decision}`,
    decision === 'approve'
      ? { method: 'POST' }
      : billingJson('POST', { rejectReason }),
    200,
  );
  if (
    !isBillingRecord(data) ||
    data.refundRequestId !== id ||
    data.status !== (decision === 'approve' ? 'COMPLETED' : 'REJECTED') ||
    !isBillingId(data.amount) ||
    !isFee(data.fee) ||
    typeof data.processedAt !== 'string'
  )
    throw new ApiError('환불 처리 응답 형식을 확인할 수 없습니다.', 200);
  return data as unknown as RefundProcessed;
};
