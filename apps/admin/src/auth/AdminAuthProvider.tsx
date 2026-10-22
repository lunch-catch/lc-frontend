import {
  type ReactNode,
  useEffect,
  useState,
  useSyncExternalStore,
} from 'react';
import { LoaderCircle } from 'lucide-react';

import { ApiError } from '@admin/api/client';
import { TableSettingsAccountContext } from '@admin/ui/DataTable/tableSettingsAccountContext';

import { AdminAuthContext } from './adminAuthContext';
import {
  getAuthState,
  loginAdmin,
  logoutAdmin,
  restoreAdmin,
  subscribeAuth,
} from './adminAuthStore';

const AuthLoading = () => {
  const [showSpinner, setShowSpinner] = useState(false);

  useEffect(() => {
    // 빠른 인증 복원에서는 로딩 표시가 나타났다 사라지는 깜빡임을 피한다.
    const timer = window.setTimeout(() => setShowSpinner(true), 300);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <main
      aria-busy="true"
      className="flex min-h-screen items-center justify-center bg-bg-page"
    >
      {showSpinner && (
        <div role="status">
          <LoaderCircle
            aria-hidden="true"
            className="size-5 animate-spin text-text-tertiary motion-reduce:animate-none"
          />
          <span className="sr-only">로그인 상태 확인 중</span>
        </div>
      )}
    </main>
  );
};

export const AdminAuthProvider = ({ children }: { children: ReactNode }) => {
  const { admin, authNotice, isRestoring, restoreError } = useSyncExternalStore(
    subscribeAuth,
    getAuthState,
  );
  useEffect(() => {
    void restoreAdmin().catch(() => undefined);
  }, []);

  // 쿠키 복원이 끝나기 전에 로그인 화면으로 이동하면 원래 방문한 경로가 사라진다.
  if (isRestoring) return <AuthLoading />;
  // 복원 실패가 공개 로그인 화면까지 가리지 않도록 오류는 로그인 안내로만 전달한다.
  const restoreNotice =
    restoreError instanceof ApiError
      ? restoreError.message
      : restoreError
        ? '로그인 상태를 확인하지 못했습니다. 연결 상태를 확인한 뒤 로그인해 주세요.'
        : null;

  return (
    <AdminAuthContext
      value={{
        admin,
        authNotice: authNotice ?? restoreNotice,
        isAuthenticated: admin !== null,
        role: admin?.role ?? null,
        login: loginAdmin,
        logout: logoutAdmin,
      }}
    >
      {/* 계정 변경을 테이블 설정에 전달하되 저장된 설정은 로그아웃 후에도 보관한다. */}
      <TableSettingsAccountContext value={admin?.adminId ?? null}>
        {children}
      </TableSettingsAccountContext>
    </AdminAuthContext>
  );
};
