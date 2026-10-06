import { Navigate, Outlet, useLocation } from 'react-router';

import { useAdminAuth } from './useAdminAuth';

export const RequireAdminAuth = () => {
  const { isAuthenticated } = useAdminAuth();
  const location = useLocation();
  if (!isAuthenticated) {
    // 공유받은 페이지·회원 검토 조건을 로그인 후에도 그대로 복원한다.
    const from = `${location.pathname}${location.search}${location.hash}`;
    return <Navigate replace to="/login" state={{ from }} />;
  }
  return <Outlet />;
};
