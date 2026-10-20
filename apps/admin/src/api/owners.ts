import { ApiError, requestData } from './client';
import { isId, isNullableText, isRecord, readListPage } from './listResponse';

export type OwnerStatus = 'ONBOARDING' | 'ACTIVE' | 'SUSPENDED' | 'WITHDRAWN';
export interface AdminOwner {
  ownerId: number;
  storeName: string | null;
  status: OwnerStatus;
  storeRegistered: boolean;
  businessNo: string | null;
  joinedAt: string;
  lastLoginAt: string | null;
}
const isOwner = (value: unknown): value is AdminOwner =>
  isRecord(value) &&
  isId(value.ownerId) &&
  isNullableText(value.storeName) &&
  (value.status === 'ONBOARDING' ||
    value.status === 'ACTIVE' ||
    value.status === 'SUSPENDED' ||
    value.status === 'WITHDRAWN') &&
  typeof value.storeRegistered === 'boolean' &&
  isNullableText(value.businessNo) &&
  typeof value.joinedAt === 'string' &&
  isNullableText(value.lastLoginAt);
export const getOwners = async (query: string, signal: AbortSignal) => {
  const data = readListPage(
    await requestData<unknown>('/v1/admin/owners?' + query, { signal }, 200),
    isOwner,
  );
  if (
    data.size !== 20 ||
    data.page !== Number(new URLSearchParams(query).get('page') ?? 0)
  )
    throw new ApiError('점주 목록의 페이지 정보를 확인할 수 없습니다.', 200);
  return data;
};
