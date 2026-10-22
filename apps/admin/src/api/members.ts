import { ApiError, requestData } from './client';
import { isId, isNullableText, isRecord, readListPage } from './listResponse';

// 서버가 지원하는 정렬 필드만 요청하며 상태 정렬은 제공하지 않는다.
export type MemberSortKey =
  'memberId' | 'nickname' | 'joinedAt' | 'lastLoginAt';

export interface AdminMember {
  memberId: number;
  nickname: string | null;
  status: 'ACTIVE' | 'SUSPENDED' | 'WITHDRAWN';
  joinedAt: string;
  lastLoginAt: string | null;
}

export interface MemberPage {
  items: AdminMember[];
  page: number;
  size: number;
  totalElements: number;
}

const isMember = (value: unknown): value is AdminMember =>
  isRecord(value) &&
  isId(value.memberId) &&
  isNullableText(value.nickname) &&
  (value.status === 'ACTIVE' ||
    value.status === 'SUSPENDED' ||
    value.status === 'WITHDRAWN') &&
  typeof value.joinedAt === 'string' &&
  isNullableText(value.lastLoginAt);

// 타입 지정만으로는 서버 응답을 검증할 수 없으므로 목록과 각 회원을 함께 검사한다.
export const getMembers = async (
  query: string,
  signal: AbortSignal,
): Promise<MemberPage> => {
  const data = readListPage(
    await requestData<unknown>(`/v1/admin/members?${query}`, { signal }, 200),
    isMember,
  );
  const params = new URLSearchParams(query);
  if (
    data.page !== Number(params.get('page') ?? 0) ||
    data.size !== Number(params.get('size') ?? 20)
  )
    throw new ApiError('회원 목록의 페이지 정보를 확인할 수 없습니다.', 200);
  return data;
};
