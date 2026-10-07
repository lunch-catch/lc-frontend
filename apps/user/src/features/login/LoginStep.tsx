import { useEffect, useState } from 'react';

import loginDiscover from '@user/assets/illustrations/login-discover.webp';
import Wordmark from '@user/components/Wordmark/Wordmark';

import { startKakaoLogin } from './kakaoLogin';
import KakaoLoginButton from './KakaoLoginButton';
import LoginStatusScreen, { loginScreenClassName } from './LoginStatusScreen';

type LoginStatus = 'idle' | 'loading' | 'error';

const LoginStep = () => {
  const [status, setStatus] = useState<LoginStatus>('idle');

  // 카카오 화면에서 뒤로 가기로 돌아오면 브라우저가 떠날 때의 화면(로그인 중)을 그대로 되살린다
  // 그때는 처음 화면으로 되돌려 다시 누를 수 있게 한다
  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) setStatus('idle');
    };

    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, []);

  // 성공하면 카카오 로그인 화면으로 떠나고, 돌아온 뒤의 처리는 콜백 화면(KakaoCallbackStep)이 한다
  const handleLogin = async () => {
    setStatus('loading');

    try {
      await startKakaoLogin();
    } catch {
      setStatus('error');
    }
  };

  if (status === 'idle') {
    return (
      <main className={loginScreenClassName}>
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

  return <LoginStatusScreen onRetry={handleLogin} status={status} />;
};

export default LoginStep;
