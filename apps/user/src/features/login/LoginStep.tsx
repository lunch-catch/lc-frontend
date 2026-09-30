import { useState } from 'react';
import { useNavigate } from 'react-router';

import { loginWithKakao } from '@user/api/auth';
import loginDiscover from '@user/assets/illustrations/login-discover.webp';
import mascotError from '@user/assets/illustrations/mascot-error.webp';
import mascotLoading from '@user/assets/illustrations/mascot-loading.webp';
import { useAuth } from '@user/auth/useAuth';

import KakaoLoginButton from './KakaoLoginButton';
import Wordmark from './Wordmark';

type LoginStatus = 'idle' | 'loading' | 'error';

const statusContent = {
  loading: {
    mascot: mascotLoading,
    title: '카카오로 로그인하고 있어요',
    description: ['잠시만 기다려 주세요.', '안전하게 계정을 연결하고 있어요.'],
    buttonLabel: '카카오 로그인 중...',
  },
  error: {
    mascot: mascotError,
    title: '로그인하지 못했어요',
    description: ['네트워크 상태를 확인한 뒤', '다시 시도해 주세요.'],
    buttonLabel: '카카오로 다시 시도하기',
  },
};

const wrapperClassName =
  'mx-auto flex min-h-dvh max-w-mobile flex-col bg-bg-page px-page pt-3 pb-[max(16px,env(safe-area-inset-bottom))]';

const LoginStep = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [status, setStatus] = useState<LoginStatus>('idle');

  const handleLogin = async () => {
    setStatus('loading');

    try {
      const user = await loginWithKakao();
      login(user);
      navigate(user.isOnboarded ? '/swipe' : '/onboarding', { replace: true });
    } catch {
      setStatus('error');
    }
  };

  if (status === 'idle') {
    return (
      <main className={wrapperClassName}>
        <Wordmark />
        <h1 className="mt-6 text-display-mobile leading-snug font-black text-text-primary">
          점심 고민,
          <br />
          오늘은 넘겨요
        </h1>
        <p className="mt-2 text-body-mobile leading-snug text-text-secondary">
          근처 맛집을 발견하고
          <br />
          오늘만의 점심 쿠폰을 받아보세요.
        </p>
        {/* 버튼 위 남는 공간을 모두 쓰고 그 가운데에 일러스트를 둔다 */}
        <div className="flex flex-1 items-center justify-center py-6">
          <img
            alt=""
            className="h-auto max-w-full"
            height={240}
            src={loginDiscover}
            width={330}
          />
        </div>
        <div className="flex flex-col items-center gap-4">
          <KakaoLoginButton onClick={handleLogin}>
            카카오로 10초 만에 시작하기
          </KakaoLoginButton>
          <p className="text-caption-mobile text-text-tertiary">
            이용약관 · 개인정보처리방침
          </p>
        </div>
      </main>
    );
  }

  const content = statusContent[status];

  return (
    <main className={wrapperClassName}>
      <Wordmark className="mt-7 text-center" />
      {/* 버튼 위 남는 공간의 세로 가운데에 마스코트와 안내 문구를 둔다 */}
      <div className="flex flex-1 flex-col items-center justify-center py-6">
        {/* 마스코트 뒤의 원형 배경 */}
        <div className="relative flex size-52 items-center justify-center rounded-full bg-surface-brand">
          <div className="size-37 rounded-full bg-action-primary/15" />
          <img
            alt=""
            className="absolute size-42"
            height={168}
            src={content.mascot}
            width={168}
          />
        </div>
        {/* 화면 읽기 프로그램이 로그인 진행과 실패를 바로 읽도록 알린다 */}
        <div aria-live="polite" className="mt-8 text-center">
          <h1 className="text-h1 font-bold text-text-primary">
            {content.title}
          </h1>
          <p className="mt-2 text-body-mobile leading-normal text-text-secondary">
            {content.description[0]}
            <br />
            {content.description[1]}
          </p>
        </div>
      </div>
      <KakaoLoginButton
        aria-busy={status === 'loading' || undefined}
        disabled={status === 'loading'}
        onClick={handleLogin}
      >
        {content.buttonLabel}
      </KakaoLoginButton>
    </main>
  );
};

export default LoginStep;
