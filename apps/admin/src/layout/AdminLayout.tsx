import { useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { Outlet, useLocation, useNavigate } from 'react-router';
import { getTheme, setTheme } from '@repo/ui';

import { useAdminAuth } from '@admin/auth/useAdminAuth';
import { AdminSidebar } from '@admin/components/AdminSidebar/AdminSidebar';

import { adminNavigationPaths, getActiveAdminItem } from './adminNavigation';

// 실제 스크롤 영역에만 공간을 확보해 테이블 폭이 흔들리거나 바깥 여백이 생기지 않게 한다.
const mainScrollClassName = [
  'min-h-0 flex-1 overflow-auto overscroll-y-contain p-6',
  '[scrollbar-gutter:stable] [scrollbar-width:thin] [scrollbar-color:var(--semantic-border-subtle)_transparent]',
  '[@supports_selector(::-webkit-scrollbar)]:[scrollbar-width:auto] [@supports_selector(::-webkit-scrollbar)]:[scrollbar-color:auto]',
  '[&::-webkit-scrollbar]:w-[var(--space-2)] [&::-webkit-scrollbar]:h-[var(--space-2)]',
  '[&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-corner]:bg-transparent',
  '[&::-webkit-scrollbar-thumb]:border-[calc(var(--space-1)/2)] [&::-webkit-scrollbar-thumb]:border-solid [&::-webkit-scrollbar-thumb]:border-transparent',
  '[&::-webkit-scrollbar-thumb]:rounded-[var(--space-2)] [&::-webkit-scrollbar-thumb]:bg-border-subtle [&::-webkit-scrollbar-thumb]:bg-clip-padding',
  '[&::-webkit-scrollbar-thumb:hover]:bg-text-tertiary',
].join(' ');

export const AdminLayout = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { logout } = useAdminAuth();
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
        theme={theme}
        onThemeToggle={handleThemeToggle}
        activeItemId={getActiveAdminItem(pathname)}
        onItemSelect={(itemId) => {
          const path = adminNavigationPaths[itemId];
          if (path) void navigate(path);
        }}
        onLogout={() => {
          logout();
          void navigate('/login', { replace: true });
        }}
      />
      <div className="flex h-full min-w-0 flex-1 flex-col">
        {/* 공통 레이아웃은 유지하고 URL에 대응하는 하위 페이지만 교체한다. */}
        <main className={mainScrollClassName} key={pathname}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};
