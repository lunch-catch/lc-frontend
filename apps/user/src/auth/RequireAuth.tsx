import { Navigate, Outlet } from 'react-router';

import type { AuthUser } from '@user/api/auth';

import { useAuth } from './useAuth';

// guest: 로그인 전, onboarding: 로그인했지만 온보딩 미완료, member: 온보딩 완료
export type AccessLevel = 'guest' | 'onboarding' | 'member';

const getAccessLevel = (user: AuthUser | null): AccessLevel => {
  if (!user) return 'guest';
  return user.isOnboarded ? 'member' : 'onboarding';
};

const homePathByAccess: Record<AccessLevel, string> = {
  guest: '/',
  onboarding: '/onboarding',
  member: '/swipe',
};

interface RequireAuthProps {
  access: AccessLevel;
}

// 현재 상태와 맞지 않는 화면에 들어오면 상태에 맞는 첫 화면으로 보낸다
const RequireAuth = ({ access }: RequireAuthProps) => {
  const { user } = useAuth();
  const currentAccess = getAccessLevel(user);

  if (currentAccess !== access) {
    return <Navigate replace to={homePathByAccess[currentAccess]} />;
  }

  return <Outlet />;
};

export default RequireAuth;
