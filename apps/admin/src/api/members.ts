import { requestData } from './client';

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

// 공통 클라이언트의 HttpOnly 쿠키 전송을 사용하고 조건 변경 시 취소할 수 있도록 signal을 전달한다.
export const getMembers = (query: string, signal: AbortSignal) =>
  requestData<MemberPage>(`/v1/admin/members?${query}`, { signal }, 200);
