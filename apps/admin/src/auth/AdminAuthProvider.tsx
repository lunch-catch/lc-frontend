import { type ReactNode, useState } from 'react';

import { initialAdminAccounts } from '@admin/api/mocks/adminAccounts';
import type { AdminAccountRole } from '@admin/features/admin-account/adminAccountTypes';

import { AdminAuthContext, type AdminLoginValues } from './adminAuthContext';

// 목업 상태만 현재 탭에 유지한다. 실제 인증·권한은 서버 응답으로 대체한다.
const storageKey = 'lunch-catch-admin-mock-authenticated';
const accountKey = 'lunch-catch-admin-mock-account-id';

const getMockRole = (loginId: string): AdminAccountRole =>
  initialAdminAccounts.find(
    (account) => account.id === loginId && account.status === 'ACTIVE',
  )?.role ?? 'ADMIN';

const readRole = (): AdminAccountRole | null => {
  try {
    return readAuthentication()
      ? getMockRole(window.sessionStorage.getItem(accountKey) ?? '')
      : null;
  } catch {
    return null;
  }
};

const readAuthentication = () => {
  try {
    return window.sessionStorage.getItem(storageKey) === 'true';
  } catch {
    return false;
  }
};

export const AdminAuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(readAuthentication);
  const [role, setRole] = useState(readRole);

  const saveAuthentication = (authenticated: boolean) => {
    setIsAuthenticated(authenticated);
    try {
      if (authenticated) window.sessionStorage.setItem(storageKey, 'true');
      else window.sessionStorage.removeItem(storageKey);
    } catch {
      // 저장소를 사용할 수 없어도 현재 화면의 로그인·로그아웃은 동작한다.
    }
  };

  const login = ({ loginId, password }: AdminLoginValues) => {
    if (!loginId || !password) return;
    const accountId = loginId.trim().toUpperCase();
    setRole(getMockRole(accountId));
    saveAuthentication(true);
    try {
      window.sessionStorage.setItem(accountKey, accountId);
    } catch {
      // 저장소가 차단된 환경에서는 현재 화면의 역할만 유지한다.
    }
  };

  const logout = () => {
    saveAuthentication(false);
    setRole(null);
    try {
      window.sessionStorage.removeItem(accountKey);
    } catch {
      // 저장소 사용 여부와 관계없이 메모리의 인증·권한은 해제한다.
    }
  };

  return (
    <AdminAuthContext
      value={{
        isAuthenticated,
        role,
        login,
        logout,
      }}
    >
      {children}
    </AdminAuthContext>
  );
};
