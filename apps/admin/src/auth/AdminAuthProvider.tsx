import { type ReactNode, useState } from 'react';

import { AdminAuthContext, type AdminLoginValues } from './adminAuthContext';

// 목업 로그인 여부만 현재 탭에 유지한다. 실제 인증은 서버의 HttpOnly 쿠키로 대체한다.
const storageKey = 'lunch-catch-admin-mock-authenticated';

const readAuthentication = () => {
  try {
    return window.sessionStorage.getItem(storageKey) === 'true';
  } catch {
    return false;
  }
};

export const AdminAuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(readAuthentication);

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
    if (loginId && password) saveAuthentication(true);
  };

  return (
    <AdminAuthContext
      value={{
        isAuthenticated,
        login,
        logout: () => saveAuthentication(false),
      }}
    >
      {children}
    </AdminAuthContext>
  );
};
