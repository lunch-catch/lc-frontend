import { ApiError, requestData } from './client';
import {
  isCount,
  isId,
  isInteger,
  isRecord,
  readListPage,
} from './listResponse';

export type InvalidReason = 'EXPIRED_OR_UNKNOWN' | 'NOT_OWNER';
export interface InvalidImpression {
  memberId: number;
  campaignId: number;
  reasonCode: InvalidReason;
  count: number;
}
export interface ReasonSummary {
  reasonCode: InvalidReason;
  count: number;
}
export interface CampaignWarning {
  campaignId: number;
  validCount: number;
  invalidCount: number;
  invalidRatio: number | null;
  invalidRatioWarning: boolean;
  distinctMemberCount: number;
  topMembersShare: number;
  concentrationWarning: boolean;
}
const isReason = (value: unknown): value is InvalidReason =>
  value === 'EXPIRED_OR_UNKNOWN' || value === 'NOT_OWNER';
const isInvalid = (value: unknown): value is InvalidImpression =>
  isRecord(value) &&
  isId(value.memberId) &&
  isInteger(value.campaignId) &&
  isReason(value.reasonCode) &&
  isCount(value.count);
const isSummary = (value: unknown): value is ReasonSummary =>
  isRecord(value) && isReason(value.reasonCode) && isCount(value.count);
const isWarning = (value: unknown): value is CampaignWarning =>
  isRecord(value) &&
  isId(value.campaignId) &&
  isCount(value.validCount) &&
  isCount(value.invalidCount) &&
  (value.invalidRatio === null ||
    (typeof value.invalidRatio === 'number' &&
      Number.isFinite(value.invalidRatio) &&
      value.invalidRatio >= 0)) &&
  typeof value.invalidRatioWarning === 'boolean' &&
  isCount(value.distinctMemberCount) &&
  typeof value.topMembersShare === 'number' &&
  Number.isFinite(value.topMembersShare) &&
  value.topMembersShare >= 0 &&
  value.topMembersShare <= 1 &&
  typeof value.concentrationWarning === 'boolean';

export const getInvalidImpressions = async (
  query: string,
  signal: AbortSignal,
) => {
  const raw = await requestData<unknown>(
    '/v1/admin/fraud/invalid-impressions?' + query,
    { signal },
    200,
  );
  const page = readListPage(raw, isInvalid);
  const params = new URLSearchParams(query);
  if (
    !isRecord(raw) ||
    page.page !== Number(params.get('page') ?? 0) ||
    page.size !== Number(params.get('size') ?? 20) ||
    raw.from !== params.get('from') ||
    raw.to !== params.get('to') ||
    !Array.isArray(raw.summaryByReason) ||
    !raw.summaryByReason.every(isSummary)
  )
    throw new ApiError('무효 노출 집계 응답을 확인할 수 없습니다.', 200);
  return {
    ...page,
    from: raw.from as string,
    to: raw.to as string,
    summaryByReason: raw.summaryByReason as ReasonSummary[],
  };
};
export const getCampaignWarnings = async (
  query: string,
  signal: AbortSignal,
) => {
  const page = readListPage(
    await requestData<unknown>(
      '/v1/admin/fraud/campaign-warnings?' + query,
      { signal },
      200,
    ),
    isWarning,
  );

  const params = new URLSearchParams(query);
  if (
    page.page !== Number(params.get('page') ?? 0) ||
    page.size !== Number(params.get('size') ?? 20)
  )
    throw new ApiError('캠페인 경고의 페이지 정보를 확인할 수 없습니다.', 200);
  return page;
};
