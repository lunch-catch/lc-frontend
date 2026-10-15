import { useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { Outlet, useLocation, useNavigate } from 'react-router';
import { Button, getTheme, setTheme } from '@repo/ui';
import { LogOut } from 'lucide-react';

import { useAdminAuth } from '@admin/auth/useAdminAuth';
import { AdminModal } from '@admin/components/AdminModal/AdminModal';
import { AdminSidebar } from '@admin/components/AdminSidebar/AdminSidebar';
import { useRequestFeedback } from '@admin/hooks/useRequestFeedback';

import { adminNavigationPaths, getActiveAdminItem } from './adminNavigation';

export const AdminLayout = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { admin, logout } = useAdminAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const logoutTriggerRef = useRef<HTMLElement | null>(null);
  const loggingOutRef = useRef(false);
  const {
    errorMessage,
    isWaiting,
    retryAfterSeconds,
    reportError,
    clearError,
  } = useRequestFeedback();
  const closeLogoutModal = () => {
    // 쿠키 폐기 결과가 확정될 때까지 확인 창을 유지한다.
    if (loggingOutRef.current) return;
    setIsLogoutModalOpen(false);
    clearError();
    logoutTriggerRef.current?.focus();
  };
  const handleLogout = async () => {
    if (loggingOutRef.current || isWaiting) return;
    loggingOutRef.current = true;
    setIsLoggingOut(true);
    clearError();
    try {
      await logout();
      void navigate('/login', { replace: true });
    } catch (error) {
      reportError(error);
    } finally {
      loggingOutRef.current = false;
      setIsLoggingOut(false);
    }
  };
  const [theme, setCurrentTheme] = useState(getTheme);
  const isThemeTransitioning = useRef(false);
  const handleThemeToggle = async () => {
    if (isThemeTransitioning.current) return;

    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    const root = document.documentElement;
    const applyTheme = () => {
      // 테마와 토글 아이콘을 함께 반영한 뒤 새 화면 스냅샷을 찍는다.
      flushSync(() => {
        setTheme(nextTheme);
        setCurrentTheme(nextTheme);
      });
    };

    isThemeTransitioning.current = true;
    root.dataset.adminThemeTransition = '';
    try {
      if (
        !document.startViewTransition ||
        window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ) {
        applyTheme();
        // 전환 효과를 복원하기 전에 새 색상을 확정해 개별 애니메이션을 막는다.
        void root.offsetWidth;
        return;
      }

      await document.startViewTransition(applyTheme).finished;
    } finally {
      delete root.dataset.adminThemeTransition;
      isThemeTransitioning.current = false;
    }
  };
  return (
    <div className="relative flex h-dvh overflow-hidden bg-bg-page">
      <AdminSidebar
        admin={admin ?? undefined}
        theme={theme}
        onThemeToggle={handleThemeToggle}
        activeItemId={getActiveAdminItem(pathname)}
        onItemSelect={(itemId) => {
          const path = adminNavigationPaths[itemId];
          if (path) void navigate(path);
        }}
        logoutDisabled={isLoggingOut || isWaiting}
        onLogout={() => {
          logoutTriggerRef.current =
            document.activeElement instanceof HTMLElement
              ? document.activeElement
              : null;
          clearError();
          setIsLogoutModalOpen(true);
        }}
      />
      <div className="flex h-full min-w-0 flex-1 flex-col">
        {/* 공통 레이아웃은 유지하고 URL에 대응하는 하위 페이지만 교체한다. */}
        <main
          className="admin-scrollbar min-h-0 flex-1 overflow-auto overscroll-y-contain p-6"
          // 첫 생성 후 편집 주소로 바뀌어도 대화 상태가 있는 편집기는 다시 마운트하지 않는다.
          key={
            pathname.startsWith('/templates/') ? '/templates/editor' : pathname
          }
        >
          <Outlet />
        </main>
      </div>
      <AdminModal
        open={isLogoutModalOpen}
        onClose={closeLogoutModal}
        title="로그아웃"
      >
        <div className="flex flex-col items-center px-2 pb-2 pt-1 text-center">
          <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-surface-subtle text-text-secondary">
            <LogOut aria-hidden="true" className="size-5" />
          </div>
          <h3 className="text-heading-sm-web font-semibold text-text-primary">
            로그아웃하시겠어요?
          </h3>
          <p className="mt-2 text-body-sm-web leading-relaxed text-text-secondary">
            다시 이용하려면 관리자 계정으로
            <br />
            로그인해 주세요.
          </p>
        </div>
        {errorMessage && (
          <p
            role="alert"
            className="mt-4 rounded-lg bg-surface-subtle px-4 py-3 text-body-sm-web text-status-danger-fg"
          >
            {errorMessage}
          </p>
        )}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <Button
            autoFocus
            className="w-full"
            variant="neutral"
            disabled={isLoggingOut}
            onClick={closeLogoutModal}
          >
            취소
          </Button>
          <Button
            className="w-full"
            isLoading={isLoggingOut}
            disabled={isWaiting}
            onClick={() => {
              void handleLogout();
            }}
          >
            {isWaiting ? `${retryAfterSeconds}초 후 로그아웃` : '로그아웃'}
          </Button>
        </div>
      </AdminModal>
    </div>
  );
};
