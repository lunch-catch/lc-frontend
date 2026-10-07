import { useState } from 'react';
import { useNavigate } from 'react-router';

import { loginWithKakao } from '@user/api/auth';
import loginDiscover from '@user/assets/illustrations/login-discover.webp';
import mascotError from '@user/assets/illustrations/mascot-error.webp';
import mascotLoading from '@user/assets/illustrations/mascot-loading.webp';
import { useAuth } from '@user/auth/useAuth';
import Wordmark from '@user/components/Wordmark/Wordmark';

import KakaoLoginButton from './KakaoLoginButton';

type LoginStatus = 'idle' | 'loading' | 'error';

// 로그인 중 점 세 개가 차례로 깜빡이도록 시작을 조금씩 늦춘다
const loadingDotDelays = [
  '[animation-delay:0ms]',
  '[animation-delay:200ms]',
  '[animation-delay:400ms]',
];

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

  // 로그인 중 화면은 잠깐 지나가므로 글은 작은 상태 문구 한 줄만 두고, 떠다니는 마스코트와 점으로 진행 중임을 보여준다
  // 움직임 줄이기 설정을 켠 사용자에게는 모두 멈춘 모습으로 보여준다
  if (status === 'loading') {
    return (
      <main className={wrapperClassName}>
        <Wordmark className="mt-7 text-center" />
        <div className="flex flex-1 flex-col items-center justify-center py-6">
          <img
            alt=""
            className="size-40 animate-float motion-reduce:animate-none"
            height={160}
            src={mascotLoading}
            width={160}
          />
          {/* 그림 아래쪽 여백만큼 끌어올려 마스코트 발밑에 둔다 */}
          <div
            aria-hidden="true"
            className="-mt-7 h-2 w-16 animate-float-shadow rounded-full bg-text-primary/10 motion-reduce:animate-none"
          />
          {/* 화면 읽기 프로그램이 로그인 진행을 바로 읽도록 알린다 */}
          <h1
            aria-live="polite"
            className="mt-6 text-h3-mobile font-semibold text-text-primary"
          >
            카카오로 로그인 중이에요
          </h1>
          <div aria-hidden="true" className="mt-3 flex gap-1.5">
            {loadingDotDelays.map((delay) => (
              <span
                className={`size-1.5 animate-dot-blink rounded-full bg-action-primary motion-reduce:animate-none ${delay}`}
                key={delay}
              />
            ))}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className={wrapperClassName}>
      <Wordmark className="mt-7 text-center" />
      {/* 버튼 위 남는 공간의 세로 가운데에 마스코트와 안내 문구를 둔다. 로그인 중 화면과 같은 크기로 맞추되 움직이지는 않는다 */}
      <div className="flex flex-1 flex-col items-center justify-center py-6">
        <img
          alt=""
          className="size-40"
          height={160}
          src={mascotError}
          width={160}
        />
        {/* 그림 아래쪽 여백만큼 끌어올려 마스코트 발밑에 둔다. 실패 그림은 아래 여백이 로그인 중 그림보다 좁다 */}
        <div
          aria-hidden="true"
          className="-mt-5 h-2 w-16 rounded-full bg-text-primary/10"
        />
        {/* 화면 읽기 프로그램이 로그인 실패를 바로 읽도록 알린다 */}
        <div aria-live="polite" className="mt-6 text-center">
          {/* 로그인 중 화면에서 그 자리 그대로 바뀌므로 제목 크기와 색을 같게 둔다 */}
          <h1 className="text-h3-mobile font-semibold text-text-primary">
            로그인하지 못했어요
          </h1>
          {/* 제목(17px)과 크기 차이가 작으면 설명이 제목만큼 무거워 보여 캡션 크기로 둔다 */}
          <p className="mt-2 text-caption-mobile leading-snug text-text-secondary">
            네트워크 상태를 확인한 뒤
            <br />
            다시 시도해 주세요.
          </p>
        </div>
      </div>
      <KakaoLoginButton onClick={handleLogin}>
        카카오로 다시 시도하기
      </KakaoLoginButton>
    </main>
  );
};

export default LoginStep;
