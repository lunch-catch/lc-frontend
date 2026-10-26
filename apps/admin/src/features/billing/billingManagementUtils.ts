import type { StatusBadgeVariant } from '@repo/ui';

import { ApiError } from '@admin/api/client';
import type { RefundStatus } from '@admin/api/refunds';
import type {
  MismatchCheckType,
  MismatchResolutionType,
} from '@admin/api/settlementMismatches';
import { getKstToday } from '@admin/hooks/queryDateUtils';

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
  PG_VS_CHARGE: '결제 승인액과 충전 원장 비교',
  CAMPAIGN_SPEND_VS_LEDGER: '캠페인 소진액과 포인트 원장 비교',
  CAMPAIGN_OVERSPEND: '예약액 초과 소진',
};
export const campaignDeductionError =
  '캠페인 관련 불일치는 포인트를 차감할 수 없습니다.';
// 상세 패널과 조정 폼에서 같은 정책 안내를 사용한다.
export const mismatchGuidance: Record<MismatchCheckType, string> = {
  PG_VS_CHARGE:
    '결제 승인액에서 해당 결제의 실제 충전액을 뺀 정확한 금액을 입력하세요. 부족분은 지급(+), 잘못 충전된 금액은 차감(−)합니다. 금액의 최종 검증은 서버에서 처리합니다.',
  CAMPAIGN_OVERSPEND:
    '실제 초과 차감액 이하의 금액만 지급(+)할 수 있습니다. 덜 차감된 광고비는 회수하지 않으며 차감(−)은 불가합니다.',
  CAMPAIGN_SPEND_VS_LEDGER:
    '원장·집계 캐시 차이는 포인트 조정 없이 종결합니다. 초과 소진이 있다면 같은 영업일의 예약액 초과 소진 건을 확인해 정정하세요. 해당 건은 이틀 뒤 00:00에 기록될 수 있습니다.',
};
export const resolutionLabels: Record<MismatchResolutionType, string> = {
  CACHE_REBUILD: '캐시 재집계',
  LEDGER_CORRECTION: '원장 보정',
  MANUAL_ADJUSTMENT: '수동 포인트 조정',
  NO_ADJUSTMENT_REQUIRED: '조정 불필요',
  OVERCHARGE_REVERSAL: '수동 포인트 조정',
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
  targetBusinessDate: string;
  amount: string;
  reason: string;
  mismatchCheckType?: MismatchCheckType;
  mismatchExcess?: number;
}

export const getPointAdjustmentError = ({
  ownerId,
  campaignId,
  targetBusinessDate,
  amount,
  reason,
  mismatchCheckType,
  mismatchExcess,
}: PointAdjustmentInput) => {
  if (mismatchCheckType === 'CAMPAIGN_SPEND_VS_LEDGER')
    return '원장·집계 캐시 불일치는 포인트를 조정할 수 없습니다. 조정 없이 종결해 주세요.';
  if (
    !isBillingInputId(ownerId) ||
    (campaignId && !isBillingInputId(campaignId))
  )
    return '점주 ID와 캠페인 ID를 양의 정수로 입력해 주세요.';
  if (campaignId) {
    const date = Date.parse(targetBusinessDate);
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(targetBusinessDate) ||
      !Number.isFinite(date) ||
      new Date(date).toISOString().slice(0, 10) !== targetBusinessDate
    )
      return '캠페인 조정의 대상 영업일을 올바르게 선택해 주세요.';
    if (targetBusinessDate > getKstToday())
      return '대상 영업일은 오늘(한국 시간) 이후로 선택할 수 없습니다.';
  } else if (targetBusinessDate) {
    return '대상 영업일은 캠페인 ID와 함께 입력해 주세요.';
  }
  const points = Number(amount);
  if (!/^-?\d+$/.test(amount) || !Number.isSafeInteger(points) || points === 0)
    return '조정 포인트를 0이 아닌 정수로 입력해 주세요.';
  // 일반 수동 조정의 캠페인 차감과, mismatchId로 연결된 캠페인 불일치 정정을 구분한다.
  if (mismatchCheckType && mismatchCheckType !== 'PG_VS_CHARGE' && points < 0)
    return campaignDeductionError;
  // 이 상한은 초과 소진 건에만 적용한다. 결제 건의 정확한 금액은 서버가 원장으로 검증한다.
  if (
    mismatchCheckType === 'CAMPAIGN_OVERSPEND' &&
    (mismatchExcess === undefined || points > mismatchExcess)
  )
    return '조정 포인트는 실제 초과 차감액 이하여야 합니다.';
  if (
    mismatchCheckType === 'PG_VS_CHARGE' &&
    (campaignId || targetBusinessDate)
  )
    return '결제 불일치 조정에는 캠페인 ID와 대상 영업일을 입력하지 않습니다.';
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
