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

// 진행 중인 시작. 버튼이 "진행 중"으로 바뀌기 전에 한 번 더 눌려도 인가 주소를 두 번 받지 않는다
// 두 번 받으면 나중 응답의 state가 보관값을 덮어써서, 먼저 받은 state로 떠난 카카오에서 돌아올 때 맞지 않는다
// 목적(로그인·탈퇴)이 다르면 합치지 않고 새로 시작한다. 탈퇴를 기다리는 사이 로그인을 누르면 로그인으로 가야 한다
let starting: { type: KakaoAuthIntent['type']; promise: Promise<void> } | null =
  null;
// 시작할 때마다 올린다. 응답이 왔을 때 더 나중에 시작한 것이 있으면 그 응답은 버린다
let generation = 0;

// 카카오 화면에서 뒤로 가기로 돌아오면 브라우저가 떠날 때의 페이지를 그대로 되살려 잠금도 남아 있다
// 그대로 두면 버튼을 다시 눌러도 아무 일도 없어서, 되살아난 페이지에서는 잠금을 푼다
window.addEventListener('pageshow', (event) => {
  if (!event.persisted) return;
  starting = null;
  generation += 1;
});

// 인가 주소를 받아 state와 목적을 보관하고 카카오 화면으로 이동한다
const startKakaoAuth = (intent: KakaoAuthIntent) => {
  if (starting?.type === intent.type) return starting.promise;

  const current = ++generation;
  const promise = (async () => {
    const authorizationUrl = await fetchKakaoAuthorizationUrl({
      // 탈퇴는 이미 로그인한 카카오 계정이어도 다시 로그인하게 한다
      reauth: intent.type === 'withdraw',
    });
    // 기다리는 사이 다른 목적으로 다시 시작했으면 이 주소로는 떠나지 않는다
    if (current !== generation) return;

    const state = new URL(authorizationUrl).searchParams.get('state');

    if (!state) {
      throw new Error('카카오 인가 주소에 state가 없습니다');
    }

    const saved: SavedKakaoAuth = { state, intent };
    window.sessionStorage.setItem(STATE_STORAGE_KEY, JSON.stringify(saved));
    // 떠나는 동안은 잠근 채로 둔다. 페이지가 바뀌면서 함께 사라진다
    window.location.assign(authorizationUrl);
  })().catch((error: unknown) => {
    // 실패하면 다시 누를 수 있게 푼다. 그사이 새로 시작한 것이 있으면 그 잠금은 건드리지 않는다
    if (current === generation) starting = null;
    throw error;
  });

  starting = { type: intent.type, promise };
  return promise;
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
    const isMatched = saved !== null && state !== null && saved.state === state;

    // 개발 중에 왜 맞지 않았는지 바로 보려고 남긴다. 보관값이 없는지, 값이 다른지 구분된다
    if (!isMatched && import.meta.env.DEV) {
      console.warn('카카오 콜백 state 불일치', {
        보관한_state: saved?.state ?? null,
        보관한_목적: saved?.intent.type ?? null,
        돌아온_state: state,
      });
    }

    return isMatched ? saved.intent : null;
  } catch {
    return null;
  }
};
