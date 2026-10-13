import {
  type ReactNode,
  useEffect,
  useState,
  useSyncExternalStore,
} from 'react';
import { Button } from '@repo/ui';
import { LoaderCircle } from 'lucide-react';

import { ApiError } from '@admin/api/client';
import { TableSettingsAccountContext } from '@admin/components/DataTable/tableSettingsAccountContext';
import { useRequestFeedback } from '@admin/hooks/useRequestFeedback';

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
  const { isWaiting, retryAfterSeconds, reportError } = useRequestFeedback();
  useEffect(() => {
    void restoreAdmin().catch(() => undefined);
  }, []);
  useEffect(() => {
    if (restoreError) reportError(restoreError);
  }, [restoreError, reportError]);

  // 쿠키 복원이 끝나기 전에 로그인 화면으로 이동하면 원래 방문한 경로가 사라진다.
  if (isRestoring) return <AuthLoading />;
  if (restoreError)
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-bg-page p-6">
        <p role="alert" className="text-body-sm-web text-text-secondary">
          {restoreError instanceof ApiError
            ? restoreError.message
            : '로그인 상태를 확인하지 못했습니다. 연결 상태를 확인해 주세요.'}
        </p>
        <Button
          disabled={isWaiting}
          onClick={() => {
            void restoreAdmin().catch(() => undefined);
          }}
        >
          {isWaiting ? `${retryAfterSeconds}초 후 다시 확인` : '다시 확인'}
        </Button>
      </main>
    );

  return (
    <AdminAuthContext
      value={{
        admin,
        authNotice,
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
