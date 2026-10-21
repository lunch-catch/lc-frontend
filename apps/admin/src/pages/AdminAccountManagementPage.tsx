import { Navigate } from 'react-router';

import { useAdminAuth } from '@admin/auth/useAdminAuth';
import { AdminAccountManagement } from '@admin/features/admin-account/AdminAccountManagement';

export const AdminAccountManagementPage = () => {
  const { role } = useAdminAuth();
  // 메뉴를 숨겨도 직접 URL로 진입할 수 있으므로 화면 접근 권한을 함께 확인한다.
  if (role !== 'SUPER_ADMIN') return <Navigate replace to="/dashboard" />;
  return <AdminAccountManagement />;
};
