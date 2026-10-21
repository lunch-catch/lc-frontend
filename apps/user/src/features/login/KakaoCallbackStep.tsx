import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';

import { loginWithKakaoCode } from '@user/api/auth';
import { ApiError } from '@user/api/client';
import { withdrawMember } from '@user/api/member';
import {
  consumeKakaoAuth,
  type KakaoAuthIntent,
  startKakaoLogin,
} from '@user/auth/kakaoLogin';
import { useAuth } from '@user/auth/useAuth';

import LoginStatusScreen from './LoginStatusScreen';
import WithdrawStatusScreen, {
  type WithdrawFailure,
} from './WithdrawStatusScreen';

// 카카오에서 돌아온 결과가 올바르지 않음 (취소했거나 다른 탭에서 시작함)
class InvalidCallbackError extends Error {}

// 탈퇴가 실패한 이유를 안내 문구에 맞게 나눈다
const getWithdrawFailure = (error: unknown): WithdrawFailure => {
  if (error instanceof InvalidCallbackError) return 'cancelled';
  if (error instanceof ApiError && error.code === 'AUTH-007') return 'reauth';
  return 'server';
};

// 카카오에서 돌아오는 화면. 떠나기 전에 적어 둔 목적에 따라 로그인하거나 탈퇴한다
// 로그인과 탈퇴 재인증이 같은 콜백 주소를 쓰므로, 로그인 여부와 상관없이 들어올 수 있다
const KakaoCallbackStep = () => {
  const navigate = useNavigate();
  const auth = useAuth();
  const [status, setStatus] = useState<'loading' | 'error'>('loading');
  const [withdrawFailure, setWithdrawFailure] =
    useState<WithdrawFailure>('cancelled');
  // 탈퇴 재인증은 로그인한 상태에서, 로그인은 로그아웃 상태에서만 시작하므로 들어올 때의 로그인 여부로 화면을 고른다
  // 로그인에 성공해 로그인 정보가 생겨도 화면이 바뀌지 않도록 처음 값으로 고정한다
  const [intentType] = useState<KakaoAuthIntent['type']>(
    auth.user ? 'withdraw' : 'login',
  );
  // 인가 코드와 state는 한 번 쓰면 끝이라, 개발 모드에서 effect가 두 번 실행돼도 한 번만 보낸다
  const hasRequested = useRef(false);

  useEffect(() => {
    if (hasRequested.current) return;
    hasRequested.current = true;

    const handleCallback = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      const state = params.get('state');
      const intent = consumeKakaoAuth(state);

      // 동의 화면에서 취소하면 code 없이 돌아오고, 다른 탭이나 브라우저에서 시작했으면 state가 다르다
      if (!intent || !code || !state) {
        throw new InvalidCallbackError('카카오 인증 결과가 올바르지 않습니다');
      }

      if (intent.type === 'withdraw') {
        await withdrawMember({
          authorizationCode: code,
          state,
          reason: intent.reason,
        });
        // 서버가 인증 쿠키를 지웠으니 화면의 로그인 정보도 지운다
        // 스플래시를 건너뛰고 로그인 화면으로 보내 탈퇴했다는 안내를 띄운다
        auth.logout();
        navigate('/login', { replace: true, state: { withdrawn: true } });
        return;
      }

      const user = await loginWithKakaoCode(code, state);
      auth.login(user);
      navigate(user.isOnboarded ? '/swipe' : '/onboarding', { replace: true });
    };

    handleCallback().catch((error: unknown) => {
      setWithdrawFailure(getWithdrawFailure(error));
      setStatus('error');
    });
  }, [auth, navigate]);

  const handleRetry = async () => {
    setStatus('loading');

    try {
      await startKakaoLogin();
    } catch {
      setStatus('error');
    }
  };

  if (intentType === 'withdraw') {
    return <WithdrawStatusScreen failure={withdrawFailure} status={status} />;
  }

  return <LoginStatusScreen onRetry={handleRetry} status={status} />;
};

export default KakaoCallbackStep;
