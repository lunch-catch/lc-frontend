import { type ReactNode, useState } from 'react';

import { loginAdmin } from '@admin/api/auth';

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
      {children}
    </AdminAuthContext>
  );
};
