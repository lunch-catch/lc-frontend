import { type ReactNode, useState } from 'react';

import { loginAdmin } from '@admin/api/auth';
import { TableSettingsAccountContext } from '@admin/components/DataTable/tableSettingsAccountContext';

import {
  AdminAuthContext,
  type AdminInfo,
  type AdminLoginValues,
} from './adminAuthContext';

export const AdminAuthProvider = ({ children }: { children: ReactNode }) => {
  // 인증 복원 API 연동 전에는 저장소의 목업 플래그로 로그인을 복원하지 않는다.
  const [admin, setAdmin] = useState<AdminInfo | null>(null);

  const login = async (values: AdminLoginValues) => {
    const authenticatedAdmin = await loginAdmin(values);
    setAdmin(authenticatedAdmin);
  };

  const logout = () => {
    // 서버 로그아웃 연동 전의 화면 상태 초기화이며 HttpOnly 쿠키는 삭제하지 못한다.
    setAdmin(null);
  };

  return (
    <AdminAuthContext
      value={{
        admin,
        isAuthenticated: admin !== null,
        role: admin?.role ?? null,
        login,
        logout,
      }}
    >
      {/* 계정 변경을 테이블 설정에 전달하되 저장된 설정은 로그아웃 후에도 보관한다. */}
      <TableSettingsAccountContext value={admin?.adminId ?? null}>
        {children}
      </TableSettingsAccountContext>
    </AdminAuthContext>
  );
};
