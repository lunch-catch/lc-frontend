import { type ReactNode, useEffect, useState } from 'react';

import type { AuthUser } from '@user/api/auth';
import { onSessionExpired } from '@user/api/client';
import { fetchMyProfile } from '@user/api/member';

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

  // 재발급까지 실패해 다시 로그인해야 하면 로그인 정보를 지운다. 접근 제어가 첫 화면으로 보낸다
  useEffect(() => onSessionExpired(() => saveUser(null)), []);

  // 저장해 둔 로그인 정보는 쿠키가 만료돼도 남아 있어서, 앱을 열 때 서버에 한 번 확인한다
  // 로그인이 끊겼으면 위의 onSessionExpired가 정리하고, 네트워크 오류는 그대로 둔다
  useEffect(() => {
    if (!readStoredUser()) return;

    fetchMyProfile()
      .then((profile) => {
        // 응답을 기다리는 사이 로그아웃했으면 지운 로그인 정보를 되살리지 않는다
        if (!readStoredUser()) return;

        saveUser({
          id: String(profile.memberId),
          nickname: profile.nickname,
          isOnboarded: profile.onboardingCompleted,
        });
      })
      .catch(() => {});
  }, []);

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
