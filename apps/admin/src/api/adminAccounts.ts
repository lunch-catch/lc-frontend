import { ApiError, requestData } from './client';
import { isRecord } from './listResponse';

export type AdminAccountRole = 'ADMIN' | 'SUPER_ADMIN';

export interface IssueAdminAccountRequest {
  loginId: string;
  initialPassword: string;
  name: string;
  role: AdminAccountRole;
}

export interface IssuedAdminAccount {
  loginId: string;
  name: string;
  role: AdminAccountRole;
}

const isAdminAccount = (value: unknown): value is IssuedAdminAccount =>
  isRecord(value) &&
  typeof value.loginId === 'string' &&
  typeof value.name === 'string' &&
  (value.role === 'ADMIN' || value.role === 'SUPER_ADMIN');

export const getAdminAccounts = async (
  keyword: string,
  signal: AbortSignal,
): Promise<IssuedAdminAccount[]> => {
  const params = new URLSearchParams();
  const normalizedKeyword = keyword.trim();
  if (normalizedKeyword) params.set('keyword', normalizedKeyword);
  const query = params.toString();
  const data = await requestData<unknown>(
    `/v1/admin/admins${query ? `?${query}` : ''}`,
    { method: 'GET', signal },
    200,
  );
  // 목록은 페이지 객체가 아닌 배열이며, 서버의 최근 발급순을 그대로 유지한다.
  if (!Array.isArray(data) || !data.every(isAdminAccount))
    throw new ApiError('관리자 목록 응답 형식을 확인할 수 없습니다.', 200);
  return data;
};

export const issueAdminAccount = async (
  values: IssueAdminAccountRequest,
): Promise<IssuedAdminAccount> => {
  const account = await requestData<unknown>(
    '/v1/admin/admins',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    },
    201,
  );
  if (!isAdminAccount(account))
    throw new ApiError('발급된 관리자 정보를 확인할 수 없습니다.', 201);
  return { loginId: account.loginId, name: account.name, role: account.role };
};
