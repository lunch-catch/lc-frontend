import { fetchKakaoAuthorizationUrl } from '@user/api/auth';

// 카카오에 다녀오는 목적. 로그인과 탈퇴 재인증이 같은 콜백 주소(/oauth/callback)로 돌아와서, 떠나기 전에 적어 둔다
// 탈퇴 사유는 서버에 함께 보내야 해서 카카오에 다녀오는 동안 보관한다
export type KakaoAuthIntent =
  { type: 'login' } | { type: 'withdraw'; reason?: string };

// 시작한 탭으로 돌아온 결과만 받도록 state와 목적을 현재 탭(sessionStorage)에 보관한다
const STATE_STORAGE_KEY = 'kakao-login-state';

interface SavedKakaoAuth {
  state: string;
  intent: KakaoAuthIntent;
}

// 인가 주소를 받아 state와 목적을 보관하고 카카오 화면으로 이동한다
const startKakaoAuth = async (intent: KakaoAuthIntent) => {
  const authorizationUrl = await fetchKakaoAuthorizationUrl({
    // 탈퇴는 이미 로그인한 카카오 계정이어도 다시 로그인하게 한다
    reauth: intent.type === 'withdraw',
  });
  const state = new URL(authorizationUrl).searchParams.get('state');

  if (!state) {
    throw new Error('카카오 인가 주소에 state가 없습니다');
  }

  const saved: SavedKakaoAuth = { state, intent };
  window.sessionStorage.setItem(STATE_STORAGE_KEY, JSON.stringify(saved));
  window.location.assign(authorizationUrl);
};

export const startKakaoLogin = () => startKakaoAuth({ type: 'login' });

export const startKakaoWithdrawAuth = (reason?: string) =>
  startKakaoAuth({ type: 'withdraw', reason });

// 보관한 값을 읽는다. 예전처럼 state 문자열만 남아 있으면 로그인으로 본다
const readSavedKakaoAuth = (): SavedKakaoAuth | null => {
  const saved = window.sessionStorage.getItem(STATE_STORAGE_KEY);
  if (!saved) return null;

  try {
    return JSON.parse(saved) as SavedKakaoAuth;
  } catch {
    return { state: saved, intent: { type: 'login' } };
  }
};

// 카카오에서 돌아온 state가 시작할 때 보관한 값과 같으면 그때의 목적을 돌려준다
// 다르거나 보관한 값이 없으면 null. 한 번 확인한 값은 지운다
export const consumeKakaoAuth = (
  state: string | null,
): KakaoAuthIntent | null => {
  try {
    const saved = readSavedKakaoAuth();
    window.sessionStorage.removeItem(STATE_STORAGE_KEY);
    return saved && state !== null && saved.state === state
      ? saved.intent
      : null;
  } catch {
    return null;
  }
};
