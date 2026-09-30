import { type ReactNode, useState } from 'react';

import type { AuthUser } from '@user/api/auth';

import { AuthContext } from './authContext';

// mock 단계라 새로고침해도 로그인이 유지되도록 localStorage에 둔다
// 실제 인증은 서버가 HttpOnly 쿠키로 관리한다
const STORAGE_KEY = 'launch-catch-user';

const readStoredUser = (): AuthUser | null => {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored ? (JSON.parse(stored) as AuthUser) : null;
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(readStoredUser);

  const saveUser = (nextUser: AuthUser | null) => {
    setUser(nextUser);

    try {
      if (nextUser) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
      } else {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // 저장소를 쓸 수 없으면 화면 상태만 유지한다
    }
  };

  return (
    <AuthContext
      value={{
        user,
        login: saveUser,
        completeOnboarding: () => {
          if (user) {
            saveUser({ ...user, isOnboarded: true });
          }
        },
        logout: () => saveUser(null),
      }}
    >
      {children}
    </AuthContext>
  );
};
