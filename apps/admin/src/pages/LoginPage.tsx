import { Navigate, useLocation } from 'react-router';

import { useAdminAuth } from '@admin/auth/useAdminAuth';
import { LoginContent } from '@admin/features/login/LoginContent';

export const LoginPage = () => {
  const { isAuthenticated, login } = useAdminAuth();
  const { state } = useLocation();
  const from = (state as { from?: unknown } | null)?.from;
  // 앱 안의 주소만 복원하며 로그인 화면으로 되돌아가는 순환 이동을 막는다.
  const destination =
    typeof from === 'string' &&
    from.startsWith('/') &&
    !from.startsWith('//') &&
    from.split(/[?#]/)[0] !== '/login'
      ? from
      : '/dashboard';
  if (isAuthenticated) return <Navigate replace to={destination} />;
  return (
    <LoginContent
      onLogin={(loginId, password) => login({ loginId, password })}
    />
  );
};
