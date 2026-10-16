import {
  isBillingId,
  isBillingInteger,
  isBillingRecord,
  isBillingText,
  isOptionalBillingId,
  readBillingPage,
} from './billingResponse';
import { requestData } from './client';

export type MismatchCheckType =
  'PG_VS_CHARGE' | 'CAMPAIGN_SPEND_VS_LEDGER' | 'CAMPAIGN_OVERSPEND';
export type MismatchResolutionType =
  'CACHE_REBUILD' | 'LEDGER_CORRECTION' | 'OVERCHARGE_REVERSAL';
export interface SettlementMismatch {
  mismatchId: number;
  checkType: MismatchCheckType;
  targetId: number;
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
  ['PG_VS_CHARGE', 'CAMPAIGN_SPEND_VS_LEDGER', 'CAMPAIGN_OVERSPEND'].includes(
    String(value.checkType),
  ) &&
  typeof value.businessDate === 'string' &&
  isBillingInteger(value.expectedValue) &&
  isBillingInteger(value.actualValue) &&
  isBillingInteger(value.diff) &&
  (value.resolutionType === null ||
    ['CACHE_REBUILD', 'LEDGER_CORRECTION', 'OVERCHARGE_REVERSAL'].includes(
      String(value.resolutionType),
    )) &&
  typeof value.createdAt === 'string' &&
  isOptionalBillingId(value.jobExecutionId) &&
  isBillingText(value.resolvedAt) &&
  isOptionalBillingId(value.resolvedBy);

export const getSettlementMismatches = async (
  query: string,
  signal: AbortSignal,
) =>
  readBillingPage(
    await requestData<unknown>(
      `/v1/admin/settlement-mismatches?${query}`,
      { signal },
      200,
    ),
    isMismatch,
  );
