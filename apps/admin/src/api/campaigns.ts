import { ApiError, requestData } from './client';
import { isCount, isId, isNullableText, isRecord } from './listResponse';

export const campaignStatuses = [
  'DRAFT',
  'SCHEDULED',
  'ACTIVE',
  'PAUSED',
  'ENDED',
] as const;
export type CampaignStatus = (typeof campaignStatuses)[number];
export type CampaignPauseReason = 'ADMIN' | 'OWNER' | 'NO_POINTS';
export type CampaignAgeGroup =
  'AGE_20S' | 'AGE_30S' | 'AGE_40S' | 'AGE_50_PLUS';

export interface AdminCampaign {
  campaignId: number;
  ownerId: number;
  storeId: number;
  storeName: string | null;
  status: CampaignStatus;
  discountTargetType: 'ALL' | 'MENU';
  discountType: 'PERCENT' | 'AMOUNT';
  discountValue: number;
  dailyBudget: number | null;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
}
export interface CampaignPage {
  items: AdminCampaign[];
  nextPageToken: string | null;
}
export interface CampaignStatusLog {
  fromStatus: CampaignStatus;
  toStatus: CampaignStatus;
  actorType: 'ADMIN' | 'OWNER' | 'SYSTEM';
  reason: string | null;
  changedAt: string;
}
export interface CampaignPoster {
  posterId: number;
  templateId: number;
  title: string;
  html: string;
}
export interface AdminCampaignDetail extends AdminCampaign {
  pausedReason: CampaignPauseReason | null;
  targetMenuId: number | null;
  issueQuantity: number;
  usableStartTime: string;
  usableEndTime: string;
  minOrderAmount: number | null;
  notice: string | null;
  targetRadius: number;
  targetGender: 'ALL' | 'MALE' | 'FEMALE';
  targetAgeGroups: CampaignAgeGroup[];
  statusChangedAt: string;
  statusLogs: CampaignStatusLog[];
  poster: CampaignPoster | null;
}

const isChoice = <T extends string>(
  value: unknown,
  choices: readonly T[],
): value is T => typeof value === 'string' && choices.includes(value as T);
const isStatus = (value: unknown): value is CampaignStatus =>
  isChoice(value, campaignStatuses);
const isOptionalCount = (value: unknown) => value === null || isCount(value);
const isOptionalId = (value: unknown) => value === null || isId(value);
const isCampaign = (value: unknown): value is AdminCampaign =>
  isRecord(value) &&
  isId(value.campaignId) &&
  isId(value.ownerId) &&
  isId(value.storeId) &&
  isNullableText(value.storeName) &&
  isStatus(value.status) &&
  isChoice(value.discountTargetType, ['ALL', 'MENU']) &&
  isChoice(value.discountType, ['PERCENT', 'AMOUNT']) &&
  isCount(value.discountValue) &&
  isOptionalCount(value.dailyBudget) &&
  isNullableText(value.startDate) &&
  isNullableText(value.endDate) &&
  typeof value.createdAt === 'string';
const isStatusLog = (value: unknown): value is CampaignStatusLog =>
  isRecord(value) &&
  isStatus(value.fromStatus) &&
  isStatus(value.toStatus) &&
  isChoice(value.actorType, ['ADMIN', 'OWNER', 'SYSTEM']) &&
  isNullableText(value.reason) &&
  typeof value.changedAt === 'string';
const isPoster = (value: unknown): value is CampaignPoster =>
  isRecord(value) &&
  isId(value.posterId) &&
  isId(value.templateId) &&
  typeof value.title === 'string' &&
  typeof value.html === 'string';
const isCampaignDetail = (value: unknown): value is AdminCampaignDetail =>
  isRecord(value) &&
  isCampaign(value) &&
  (value.pausedReason === null ||
    isChoice(value.pausedReason, ['ADMIN', 'OWNER', 'NO_POINTS'])) &&
  isOptionalId(value.targetMenuId) &&
  isCount(value.issueQuantity) &&
  typeof value.usableStartTime === 'string' &&
  typeof value.usableEndTime === 'string' &&
  isOptionalCount(value.minOrderAmount) &&
  isNullableText(value.notice) &&
  isCount(value.targetRadius) &&
  isChoice(value.targetGender, ['ALL', 'MALE', 'FEMALE']) &&
  Array.isArray(value.targetAgeGroups) &&
  value.targetAgeGroups.every((age) =>
    isChoice(age, ['AGE_20S', 'AGE_30S', 'AGE_40S', 'AGE_50_PLUS']),
  ) &&
  typeof value.statusChangedAt === 'string' &&
  Array.isArray(value.statusLogs) &&
  value.statusLogs.every(isStatusLog) &&
  (value.poster === null || isPoster(value.poster));

export const getCampaigns = async (
  query: string,
  signal: AbortSignal,
): Promise<CampaignPage> => {
  const data = await requestData<unknown>(
    `/v1/admin/campaigns?${query}`,
    { signal },
    200,
  );
  if (
    !isRecord(data) ||
    !Array.isArray(data.items) ||
    !data.items.every(isCampaign) ||
    !(
      data.nextPageToken === null ||
      (typeof data.nextPageToken === 'string' && data.nextPageToken.length > 0)
    )
  )
    throw new ApiError('캠페인 목록 응답 형식을 확인할 수 없습니다.', 200);
  return { items: data.items, nextPageToken: data.nextPageToken };
};

export const getCampaign = async (
  id: string,
  signal: AbortSignal,
): Promise<AdminCampaignDetail> => {
  const data = await requestData<unknown>(
    `/v1/admin/campaigns/${encodeURIComponent(id)}`,
    { signal },
    200,
  );
  if (!isCampaignDetail(data) || String(data.campaignId) !== id)
    throw new ApiError('캠페인 상세 응답 형식을 확인할 수 없습니다.', 200);
  return data;
};
