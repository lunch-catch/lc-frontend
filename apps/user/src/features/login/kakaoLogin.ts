import { fetchKakaoAuthorizationUrl } from '@user/api/auth';

// 로그인을 시작한 탭으로 돌아온 결과만 받도록 state를 현재 탭(sessionStorage)에 보관한다
const STATE_STORAGE_KEY = 'kakao-login-state';

// 인가 주소를 받아 state를 보관하고 카카오 로그인 화면으로 이동한다
export const startKakaoLogin = async () => {
  const authorizationUrl = await fetchKakaoAuthorizationUrl();
  const state = new URL(authorizationUrl).searchParams.get('state');

  if (!state) {
    throw new Error('카카오 인가 주소에 state가 없습니다');
  }

  window.sessionStorage.setItem(STATE_STORAGE_KEY, state);
  window.location.assign(authorizationUrl);
};

// 카카오에서 돌아온 state가 시작할 때 보관한 값과 같은지 확인한다. 한 번 확인한 값은 지운다
export const consumeKakaoLoginState = (state: string | null) => {
  try {
    const savedState = window.sessionStorage.getItem(STATE_STORAGE_KEY);
    window.sessionStorage.removeItem(STATE_STORAGE_KEY);
    return state !== null && state === savedState;
  } catch {
    return false;
  }
};
