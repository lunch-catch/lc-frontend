import type {
  AdminAccountForm,
  IssuedAdminAccount,
} from '@admin/features/admin-account/adminAccountTypes';

import { ApiError, requestData } from './client';

export const issueAdminAccount = async (
  form: AdminAccountForm,
): Promise<IssuedAdminAccount> => {
  const account = await requestData<IssuedAdminAccount>(
    '/v1/admin/admins',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        loginId: form.id.trim(),
        initialPassword: form.password,
        name: form.name.trim(),
        role: form.role,
      }),
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
