import type { StatusBadgeVariant } from '@repo/ui';

import { ApiError } from '@admin/api/client';
import type {
  PaymentReconciliationStatus,
  PaymentSearchType,
  PaymentStatus,
} from '@admin/api/payments';

export const paymentStatusLabels: Record<PaymentStatus, string> = {
  REQUESTED: '결제 대기',
  APPROVED: '결제 성공',
  FAILED: '결제 실패',
  CANCELLED: '취소됨',
  UNKNOWN: '확인 필요',
};
export const paymentVariants: Record<PaymentStatus, StatusBadgeVariant> = {
  REQUESTED: 'warning',
  APPROVED: 'success',
  FAILED: 'danger',
  CANCELLED: 'neutral',
  UNKNOWN: 'warning',
};
export const paymentSearchOptions: {
  label: string;
  value: PaymentSearchType;
}[] = [
  { label: '점주 ID', value: 'OWNER_ID' },
  { label: '주문 번호', value: 'ORDER_ID' },
  { label: '거래 ID', value: 'PG_TID' },
];
export const reconciliationLabels: Record<PaymentReconciliationStatus, string> =
  {
    PENDING: '재조회 대기',
    RESOLVED: '확정 완료',
    FAILED_PERMANENT: '자동 재조회 종료',
  };

export const getPaymentError = (error: unknown) => {
  if (error instanceof ApiError) {
    if (error.code === 'BILLING-004')
      return '결제를 찾을 수 없습니다. 목록을 다시 확인해 주세요.';
    if (error.code === 'BILLING-005')
      return '이미 결제 결과가 확정되어 재조회할 수 없습니다. 목록을 갱신했습니다.';
    return error.message;
  }
  return '서버에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.';
};

export const getPaymentFilterError = (
  from: string,
  to: string,
  searchType: PaymentSearchType,
  keyword: string,
) => {
  if (from && to && from > to)
    return '시작 날짜는 종료 날짜보다 늦을 수 없습니다.';
  if (
    searchType === 'OWNER_ID' &&
    keyword &&
    (!/^\d+$/.test(keyword) ||
      !Number.isSafeInteger(Number(keyword)) ||
      Number(keyword) <= 0)
  )
    return '점주 ID를 양의 정수로 입력해 주세요.';
  return '';
};
