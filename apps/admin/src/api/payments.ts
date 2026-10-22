import { ApiError, requestData } from './client';

// 실제 API의 상태 이름을 사용한다. 기능 명세의 PENDING·SUCCESS·CANCELED와 구분한다.
export type PaymentStatus =
  'REQUESTED' | 'APPROVED' | 'FAILED' | 'CANCELLED' | 'UNKNOWN';
export type PaymentSearchType = 'OWNER_ID' | 'ORDER_ID' | 'PG_TID';
export type PaymentSortKey = 'requestedAt' | 'amount' | 'approvedAt';
export type PaymentReconciliationStatus =
  'PENDING' | 'RESOLVED' | 'FAILED_PERMANENT';

export interface PaymentReconciliation {
  status: PaymentReconciliationStatus;
  attemptCount: number;
  maxRetry: number;
  nextRetryAt: string | null;
  lastError: string | null;
}

export interface AdminPayment {
  paymentId: number;
  orderId: string;
  pgTid: string | null;
  ownerId: number;
  amount: number;
  chargedPoint: number;
  status: PaymentStatus;
  failureReason: string | null;
  requestedAt: string;
  approvedAt: string | null;
  canceledAt: string | null;
  reconciliation: PaymentReconciliation | null;
}

export interface PaymentPage {
  items: AdminPayment[];
  page: number;
  size: number;
  totalElements: number;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object';
const isInteger = (value: unknown, minimum = 0): value is number =>
  typeof value === 'number' && Number.isSafeInteger(value) && value >= minimum;
const isNullableString = (value: unknown) =>
  value === null || typeof value === 'string';

const isReconciliation = (value: unknown) =>
  value === null ||
  (isRecord(value) &&
    typeof value.status === 'string' &&
    ['PENDING', 'RESOLVED', 'FAILED_PERMANENT'].includes(value.status) &&
    isInteger(value.attemptCount) &&
    isInteger(value.maxRetry) &&
    isNullableString(value.nextRetryAt) &&
    isNullableString(value.lastError));

const isPayment = (value: unknown): value is AdminPayment =>
  isRecord(value) &&
  isInteger(value.paymentId, 1) &&
  isInteger(value.ownerId, 1) &&
  typeof value.orderId === 'string' &&
  isNullableString(value.pgTid) &&
  isInteger(value.amount) &&
  isInteger(value.chargedPoint) &&
  typeof value.status === 'string' &&
  ['REQUESTED', 'APPROVED', 'FAILED', 'CANCELLED', 'UNKNOWN'].includes(
    value.status,
  ) &&
  isNullableString(value.failureReason) &&
  typeof value.requestedAt === 'string' &&
  isNullableString(value.approvedAt) &&
  isNullableString(value.canceledAt) &&
  isReconciliation(value.reconciliation);

/** 검색·정렬·페이지 조건으로 결제 목록을 조회하고, 화면에서 사용하는 필드를 검증한다. */
export const getPayments = async (
  query: string,
  signal: AbortSignal,
): Promise<PaymentPage> => {
  const data = await requestData<unknown>(
    `/v1/admin/payments?${query}`,
    { signal },
    200,
  );
  if (
    !isRecord(data) ||
    !Array.isArray(data.items) ||
    !data.items.every(isPayment) ||
    !isInteger(data.page) ||
    !isInteger(data.size, 1) ||
    data.size > 100 ||
    !isInteger(data.totalElements) ||
    data.items.length > data.size ||
    data.totalElements < data.items.length
  )
    throw new ApiError('결제 목록 응답 형식을 확인할 수 없습니다.', 200);
  return data as unknown as PaymentPage;
};

/** 결제대행사의 실제 상태를 확인하며, 확정할 수 없으면 UNKNOWN인 결제도 정상 응답으로 반환한다. */
export const recheckPayment = async (
  paymentId: number,
): Promise<AdminPayment> => {
  const data = await requestData<unknown>(
    `/v1/admin/payments/${paymentId}:recheck`,
    { method: 'POST' },
    200,
  );
  if (!isPayment(data) || data.paymentId !== paymentId)
    throw new ApiError('결제 재조회 응답 형식을 확인할 수 없습니다.', 200);
  return data;
};
