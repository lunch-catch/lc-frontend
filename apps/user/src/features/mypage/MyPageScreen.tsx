import { useEffect, useState } from 'react';

import { logout } from '@user/api/auth';
import { useAuth } from '@user/auth/useAuth';
import FeedbackToast from '@user/components/FeedbackToast/FeedbackToast';
import TopBar from '@user/components/TopBar/TopBar';

const TOAST_DURATION_MS = 2500;

// 마이 탭. 지금은 로그아웃만 있고, 회원 정보와 메뉴는 이어서 채운다
const MyPageScreen = () => {
  const auth = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!hasError) return;

    const timer = setTimeout(() => setHasError(false), TOAST_DURATION_MS);
    return () => clearTimeout(timer);
  }, [hasError]);

  // 서버에서 쿠키를 지운 뒤에만 화면의 로그인 상태를 지운다
  // 먼저 지우면 쿠키가 남아 다시 들어왔을 때 로그인된 채로 열린다
  // 로그인 상태가 사라지면 접근 제어가 첫 화면으로 보낸다
  const handleLogout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);
    try {
      await logout();
      auth.logout();
    } catch {
      setHasError(true);
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="relative flex flex-1 flex-col">
      <TopBar title="마이페이지" tone="page" />
      {hasError && (
        <div className="absolute inset-x-0 top-14 z-20 px-page">
          <FeedbackToast message="로그아웃하지 못했어요" tone="error" />
        </div>
      )}
      <div className="flex flex-1 flex-col justify-end px-page pt-4 pb-6">
        <button
          aria-busy={isLoggingOut || undefined}
          className="h-12 w-full rounded-lg border border-border-subtle bg-bg-surface text-body-sm-mobile font-bold text-text-secondary active:bg-surface-subtle focus-visible:outline-2 focus-visible:outline-action-primary aria-busy:cursor-progress aria-busy:opacity-60"
          onClick={handleLogout}
          type="button"
        >
          {isLoggingOut ? '로그아웃하는 중' : '로그아웃'}
        </button>
      </div>
    </div>
  );
};

export default MyPageScreen;
