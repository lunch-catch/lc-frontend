import { ApiError, requestData } from './client';

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

export const issueAdminAccount = async (
  values: IssueAdminAccountRequest,
): Promise<IssuedAdminAccount> => {
  const account = await requestData<IssuedAdminAccount>(
    '/v1/admin/admins',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    },
    201,
  );
  if (
    typeof account.loginId !== 'string' ||
    typeof account.name !== 'string' ||
    !['ADMIN', 'SUPER_ADMIN'].includes(account.role)
  )
    throw new ApiError('발급된 관리자 정보를 확인할 수 없습니다.', 201);
  return { loginId: account.loginId, name: account.name, role: account.role };
};
