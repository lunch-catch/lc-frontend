import type { AdminInfo, AdminLoginValues } from '@admin/auth/adminAuthContext';

import { ApiError, request, requestData } from './client';

const parseAdmin = (admin: AdminInfo): AdminInfo => {
  if (
    !Number.isSafeInteger(admin.adminId) ||
    admin.adminId <= 0 ||
    typeof admin.name !== 'string' ||
    !['ADMIN', 'SUPER_ADMIN'].includes(admin.role)
  )
    throw new ApiError('관리자 정보를 확인할 수 없습니다.', 200);
  return { adminId: admin.adminId, name: admin.name, role: admin.role };
};

export const loginAdmin = async (
  values: AdminLoginValues,
): Promise<AdminInfo> =>
  parseAdmin(
    await requestData<AdminInfo>(
      '/v1/admin/auth/tokens',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      },
      200,
    ),
  );

export const refreshAdmin = async (): Promise<AdminInfo> =>
  parseAdmin(
    await requestData<AdminInfo>(
      '/v1/admin/auth/tokens:refresh',
      { method: 'POST' },
      200,
    ),
  );

export const logoutAdmin = async (): Promise<void> => {
  const response = await request('/v1/admin/auth/tokens', { method: 'DELETE' });
  // 로그아웃 성공 응답에는 JSON 본문이 없다.
  if (response.status !== 204)
    throw new ApiError('로그아웃 응답을 확인할 수 없습니다.', response.status);
};
