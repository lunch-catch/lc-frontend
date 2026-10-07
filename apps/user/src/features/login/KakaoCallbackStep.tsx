import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';

import { loginWithKakaoCode } from '@user/api/auth';
import { useAuth } from '@user/auth/useAuth';

import { consumeKakaoLoginState, startKakaoLogin } from './kakaoLogin';
import LoginStatusScreen from './LoginStatusScreen';

// 카카오 로그인을 마치고 돌아오는 화면. 주소에 붙어 온 인가 코드로 로그인한다
const KakaoCallbackStep = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [status, setStatus] = useState<'loading' | 'error'>('loading');
  // 인가 코드와 state는 한 번 쓰면 끝이라, 개발 모드에서 effect가 두 번 실행돼도 한 번만 보낸다
  const hasRequested = useRef(false);

  useEffect(() => {
    if (hasRequested.current) return;
    hasRequested.current = true;

    const loginWithCallback = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      const state = params.get('state');

      // 동의 화면에서 취소하면 code 없이 돌아오고, 다른 탭이나 브라우저에서 시작한 로그인이면 state가 다르다
      if (!consumeKakaoLoginState(state) || !code || !state) {
        throw new Error('카카오 로그인 결과가 올바르지 않습니다');
      }

      return loginWithKakaoCode(code, state);
    };

    loginWithCallback()
      .then((user) => {
        login(user);
        navigate(user.isOnboarded ? '/swipe' : '/onboarding', {
          replace: true,
        });
      })
      .catch(() => setStatus('error'));
  }, [login, navigate]);

  const handleRetry = async () => {
    setStatus('loading');

    try {
      await startKakaoLogin();
    } catch {
      setStatus('error');
    }
  };

  return <LoginStatusScreen onRetry={handleRetry} status={status} />;
};

export default KakaoCallbackStep;
