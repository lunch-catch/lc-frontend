import {
  isBillingId,
  isBillingInteger,
  isBillingRecord,
  isBillingText,
  isOptionalBillingId,
  readBillingPage,
} from './billingResponse';
import { ApiError, requestData } from './client';

export type MismatchCheckType =
  'PG_VS_CHARGE' | 'CAMPAIGN_SPEND_VS_LEDGER' | 'CAMPAIGN_OVERSPEND';
export type MismatchResolutionType =
  | 'CACHE_REBUILD'
  | 'LEDGER_CORRECTION'
  | 'MANUAL_ADJUSTMENT'
  | 'NO_ADJUSTMENT_REQUIRED'
  // 배포 전 응답과 기존 로컬 데이터도 전환 기간에는 함께 읽는다.
  | 'OVERCHARGE_REVERSAL';
export interface SettlementMismatch {
  mismatchId: number;
  checkType: MismatchCheckType;
  targetId: number;
  ownerId: number | null;
  /** 대사 대상 영업일(YYYY-MM-DD). 발견 시각(createdAt)과 달리 시각은 없다. */
  businessDate: string;
  expectedValue: number;
  actualValue: number;
  diff: number;
  resolutionType: MismatchResolutionType | null;
  createdAt: string;
  jobExecutionId: number | null;
  resolvedAt: string | null;
  resolvedBy: number | null;
}
const isMismatch = (value: unknown): value is SettlementMismatch =>
  isBillingRecord(value) &&
  isBillingId(value.mismatchId) &&
  isBillingId(value.targetId) &&
  isOptionalBillingId(value.ownerId) &&
  ['PG_VS_CHARGE', 'CAMPAIGN_SPEND_VS_LEDGER', 'CAMPAIGN_OVERSPEND'].includes(
    String(value.checkType),
  ) &&
  typeof value.businessDate === 'string' &&
  isBillingInteger(value.expectedValue) &&
  isBillingInteger(value.actualValue) &&
  isBillingInteger(value.diff) &&
  (value.resolutionType === null ||
    [
      'CACHE_REBUILD',
      'LEDGER_CORRECTION',
      'MANUAL_ADJUSTMENT',
      'NO_ADJUSTMENT_REQUIRED',
      'OVERCHARGE_REVERSAL',
    ].includes(String(value.resolutionType))) &&
  typeof value.createdAt === 'string' &&
  isOptionalBillingId(value.jobExecutionId) &&
  isBillingText(value.resolvedAt) &&
  isOptionalBillingId(value.resolvedBy);

const normalizeMismatch = (item: unknown) =>
  isBillingRecord(item) && item.ownerId === undefined
    ? { ...item, ownerId: null }
    : item;

export const getSettlementMismatches = async (
  query: string,
  signal: AbortSignal,
) => {
  const data = await requestData<unknown>(
    `/v1/admin/settlement-mismatches?${query}`,
    { signal },
    200,
  );
  // ownerId 추가 전 응답도 건수·목록 조회에는 사용한다. 점주를 추정하지 않고
  // null로 정규화하면 기존 UI가 정정 버튼을 비활성화해 잘못된 조정을 막는다.
  const normalized =
    isBillingRecord(data) && Array.isArray(data.items)
      ? {
          ...data,
          items: data.items.map(normalizeMismatch),
        }
      : data;
  return readBillingPage(normalized, isMismatch);
};

/** 원장은 변경하지 않고 종결한다. 재호출 시 서버는 BILLING-021을 반환한다. */
export const closeSettlementMismatch = async (
  mismatchId: number,
): Promise<SettlementMismatch> => {
  const data = normalizeMismatch(
    await requestData<unknown>(
      `/v1/admin/settlement-mismatches/${mismatchId}:closeWithoutAdjustment`,
      { method: 'POST' },
      200,
    ),
  );
  if (
    !isMismatch(data) ||
    data.mismatchId !== mismatchId ||
    data.resolutionType !== 'NO_ADJUSTMENT_REQUIRED' ||
    data.resolvedAt === null ||
    data.resolvedBy === null
  ) {
    throw new ApiError('정산 불일치 종결 응답을 확인할 수 없습니다.', 200);
  }
  return data;
};
