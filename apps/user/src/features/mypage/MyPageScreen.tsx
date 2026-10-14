import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { ChevronRight } from 'lucide-react';

import { logout } from '@user/api/auth';
import { fetchMyProfile } from '@user/api/member';
import { useAuth } from '@user/auth/useAuth';
import FeedbackToast from '@user/components/FeedbackToast/FeedbackToast';
import TopBar from '@user/components/TopBar/TopBar';

import ConsentSettings from './ConsentSettings';
import ProfileSummary from './ProfileSummary';
import { useLoad } from './useLoad';

const TOAST_DURATION_MS = 2500;

// 찜 목록과 사용 내역은 쿠폰함 탭에 있어 새 화면 없이 그 탭으로 보낸다
const menuItems = [
  { label: '찜 목록', to: '/coupons/wishlist' },
  { label: '쿠폰 사용 내역', to: '/coupons/history' },
  { label: '위치 설정', to: '/my/location' },
];

// 마이 탭. 프로필과 쿠폰 요약, 바로가기, 알림·위치 설정, 로그아웃
const MyPageScreen = () => {
  const auth = useAuth();
  const profile = useLoad(fetchMyProfile);
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
    <div className="flex flex-1 flex-col">
      <TopBar title="마이페이지" tone="page" />
      <div className="flex flex-1 flex-col gap-3 px-page pt-2 pb-6">
        <ProfileSummary profile={profile} />
        <nav aria-label="바로가기">
          <ul className="divide-y divide-border-subtle overflow-hidden rounded-xl border border-border-subtle bg-bg-surface">
            {menuItems.map(({ label, to }) => (
              <li key={to}>
                <Link
                  className="flex h-13 items-center justify-between px-4 text-body-sm-mobile font-medium text-text-primary active:bg-surface-subtle focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-action-primary"
                  to={to}
                >
                  {label}
                  <ChevronRight
                    aria-hidden="true"
                    className="size-5 text-text-tertiary"
                  />
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        {/* 내 정보를 받은 뒤에 보여준다. 못 받으면 위 프로필 자리에서 다시 시도한다 */}
        {profile.data && (
          <div className="mt-3">
            <ConsentSettings
              consents={profile.data.consents}
              onSaved={profile.setData}
            />
          </div>
        )}
        {/* 메뉴가 적어도 로그아웃은 화면 아래쪽에 둔다 */}
        <div className="flex-1" />
        <div className="relative">
          {/* 실패 안내는 누른 버튼 바로 위에 띄운다. 위쪽에 띄우면 프로필을 가린다 */}
          {hasError && (
            <div className="absolute inset-x-0 bottom-full z-20 pb-2">
              <FeedbackToast message="로그아웃하지 못했어요" tone="error" />
            </div>
          )}
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
    </div>
  );
};

export default MyPageScreen;
