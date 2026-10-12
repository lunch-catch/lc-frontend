import type { AdminInfo, AdminLoginValues } from '@admin/auth/adminAuthContext';

import { ApiError, requestData } from './client';

export const loginAdmin = async (
  values: AdminLoginValues,
): Promise<AdminInfo> => {
  const admin = await requestData<AdminInfo>(
    '/v1/admin/auth/tokens',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    },
    200,
  );
  if (
    !Number.isSafeInteger(admin.adminId) ||
    admin.adminId <= 0 ||
    typeof admin.name !== 'string' ||
    !['ADMIN', 'SUPER_ADMIN'].includes(admin.role)
  )
    throw new ApiError('관리자 정보를 확인할 수 없습니다.', 200);
  return { adminId: admin.adminId, name: admin.name, role: admin.role };
};
