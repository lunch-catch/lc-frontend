import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { ChevronRight } from 'lucide-react';

import { logout } from '@user/api/auth';
import { fetchMyProfile } from '@user/api/member';
import { useAuth } from '@user/auth/useAuth';
import TopBar from '@user/components/TopBar/TopBar';

import ConsentSettings from './ConsentSettings';
import ThemeSettings from './ThemeSettings';
import { useLoad } from './useLoad';

// 설정. 가끔 바꾸는 알림·위치 동의, 화면 모드, 계정 관리를 마이 탭에서 한 단계 안쪽에 모은다
const SettingsScreen = () => {
  const navigate = useNavigate();
  const auth = useAuth();
  const profile = useLoad(fetchMyProfile);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [hasLogoutError, setHasLogoutError] = useState(false);

  // 서버에서 쿠키를 지운 뒤에만 화면의 로그인 상태를 지운다
  // 먼저 지우면 쿠키가 남아 다시 들어왔을 때 로그인된 채로 열린다
  // 로그인 상태가 사라지면 접근 제어가 첫 화면으로 보낸다
  const handleLogout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);
    setHasLogoutError(false);
    try {
      await logout();
      auth.logout();
    } catch {
      setHasLogoutError(true);
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="flex flex-col">
      <TopBar onBack={() => navigate(-1)} title="설정" />
      <div className="flex flex-col gap-6 px-page pt-4 pb-6">
        {profile.data === undefined && (
          <div
            aria-hidden="true"
            className="h-36 animate-pulse rounded-xl bg-surface-subtle motion-reduce:animate-none"
          />
        )}
        {profile.data === null && (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-border-subtle bg-bg-surface px-4 py-4">
            <p className="text-body-sm-mobile text-text-secondary">
              알림·위치 설정을 불러오지 못했어요
            </p>
            <button
              className="h-9 shrink-0 rounded-lg border border-border-subtle px-3 text-body-sm-mobile font-bold text-text-primary active:bg-surface-subtle focus-visible:outline-2 focus-visible:outline-action-primary"
              onClick={profile.retry}
              type="button"
            >
              다시 시도
            </button>
          </div>
        )}
        {profile.data && (
          <ConsentSettings
            consents={profile.data.consents}
            onSaved={profile.setData}
          />
        )}

        <ThemeSettings />

        <section aria-labelledby="account-settings-title">
          <h2
            className="mb-2 px-1 text-body-sm-mobile font-bold text-text-primary"
            id="account-settings-title"
          >
            계정
          </h2>
          <ul className="divide-y divide-border-subtle overflow-hidden rounded-xl border border-border-subtle bg-bg-surface">
            <li>
              <button
                aria-busy={isLoggingOut || undefined}
                className="flex h-13 w-full items-center px-4 text-left text-body-sm-mobile font-medium text-text-primary active:bg-surface-subtle focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-action-primary aria-busy:cursor-progress aria-busy:opacity-60"
                onClick={handleLogout}
                type="button"
              >
                {isLoggingOut ? '로그아웃하는 중' : '로그아웃'}
              </button>
            </li>
            <li>
              <Link
                className="flex h-13 items-center justify-between px-4 text-body-sm-mobile font-medium text-text-secondary active:bg-surface-subtle focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-action-primary"
                to="/my/withdraw"
              >
                회원 탈퇴
                <ChevronRight
                  aria-hidden="true"
                  className="size-5 text-text-tertiary"
                />
              </Link>
            </li>
          </ul>
          {hasLogoutError && (
            <p
              className="mt-2 px-1 text-caption-mobile text-status-danger-fg"
              role="alert"
            >
              로그아웃하지 못했어요 · 다시 눌러 주세요
            </p>
          )}
        </section>
      </div>
    </div>
  );
};

export default SettingsScreen;
