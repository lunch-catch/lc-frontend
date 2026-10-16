import type { StatusBadgeVariant } from '@repo/ui';

import { ApiError } from '@admin/api/client';
import type { RefundStatus } from '@admin/api/refunds';
import type {
  MismatchCheckType,
  MismatchResolutionType,
} from '@admin/api/settlementMismatches';

export const refundStatusLabels: Record<RefundStatus, string> = {
  REQUESTED: '처리 대기',
  APPROVED: '승인됨',
  REJECTED: '반려됨',
  COMPLETED: '환불 완료',
};
export const refundVariants: Record<RefundStatus, StatusBadgeVariant> = {
  REQUESTED: 'warning',
  APPROVED: 'info',
  REJECTED: 'danger',
  COMPLETED: 'success',
};
export const mismatchLabels: Record<MismatchCheckType, string> = {
  PG_VS_CHARGE: '결제 승인 / 충전 원장',
  CAMPAIGN_SPEND_VS_LEDGER: '캠페인 소진 / 원장',
};
export const resolutionLabels: Record<MismatchResolutionType, string> = {
  CACHE_REBUILD: '캐시 재집계',
  LEDGER_CORRECTION: '원장 보정',
  OVERCHARGE_REVERSAL: '과과금 정정',
};
const errors: Record<string, string> = {
  'BILLING-006':
    '잔액을 조회하거나 처리를 완료하지 못했습니다. 잠시 후 다시 시도해 주세요.',
  'BILLING-010': '집행 중인 캠페인이 있어 환불할 수 없습니다.',
  'BILLING-013': '현재 잔액이 환불 요청 금액보다 적습니다.',
  'BILLING-014': '환불 요청을 찾을 수 없습니다.',
  'BILLING-015': '이미 처리된 환불 요청입니다. 목록을 다시 확인해 주세요.',
  'BILLING-016': '조정 후 잔액이 음수가 되어 처리할 수 없습니다.',
  'BILLING-018':
    '같은 요청 번호로 다른 조정이 처리되었습니다. 처리 내역을 확인해 주세요.',
  'BILLING-019': '점주를 찾을 수 없습니다.',
  'BILLING-020': '정산 불일치 건을 찾을 수 없습니다.',
  'BILLING-021': '이미 해결된 정산 불일치 건입니다.',
  'BILLING-022': '정산 불일치 건이 입력한 점주의 내역이 아닙니다.',
};
export const getBillingManagementError = (error: unknown) =>
  error instanceof ApiError
    ? (errors[error.code ?? ''] ?? error.message)
    : '서버에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.';

export const getBillingRangeError = (from: string, to: string) =>
  from && to && from > to ? '시작 날짜는 종료 날짜보다 늦을 수 없습니다.' : '';
export const isBillingInputId = (value: string) =>
  /^\d+$/.test(value) &&
  Number.isSafeInteger(Number(value)) &&
  Number(value) > 0;

interface PointAdjustmentInput {
  ownerId: string;
  campaignId: string;
  amount: string;
  reason: string;
  correctingMismatch: boolean;
}

export const getPointAdjustmentError = ({
  ownerId,
  campaignId,
  amount,
  reason,
  correctingMismatch,
}: PointAdjustmentInput) => {
  if (
    !isBillingInputId(ownerId) ||
    (campaignId && !isBillingInputId(campaignId))
  )
    return '점주 ID와 캠페인 ID를 양의 정수로 입력해 주세요.';
  const points = Number(amount);
  if (!/^-?\d+$/.test(amount) || !Number.isSafeInteger(points) || points === 0)
    return '조정 포인트를 0이 아닌 정수로 입력해 주세요.';
  // 불일치 정정 API는 과도하게 차감된 포인트를 돌려주는 조정만 허용한다.
  if (correctingMismatch && points < 0)
    return '정산 불일치 정정은 포인트를 돌려주는 양수 조정만 가능합니다.';
  if (!reason.trim() || reason.length > 255)
    return '조정 사유를 1~255자로 입력해 주세요.';
  return '';
};

export const getPointPolicyError = (
  minimum: string,
  products: string[],
  reason: string,
) => {
  if (!isBillingInputId(minimum))
    return '최소 충전 금액을 0보다 큰 정수로 입력해 주세요.';
  if (
    !products.length ||
    products.some(
      (value) => !isBillingInputId(value) || Number(value) < Number(minimum),
    )
  )
    return '충전 상품을 하나 이상 입력하고, 각 금액을 최소 충전 금액 이상으로 설정해 주세요.';
  if (reason.length > 255) return '변경 사유는 255자 이하로 입력해 주세요.';
  return '';
};
