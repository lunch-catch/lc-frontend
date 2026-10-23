// 로그인 화면의 첫 등장 효과(제목 타이핑 → 문구 → 마스코트). 한 번 보면 같은 탭에서는 다시 보여주지 않는다
const STORAGE_KEY = 'launch-catch-login-intro-seen';

// 제목 한 글자가 나오는 간격(ms)과 타이핑을 시작하기 전 잠깐 멈추는 시간(ms)
export const TYPING_CHAR_MS = 70;
export const TYPING_START_DELAY_MS = 250;

// 뒤따르는 문구와 마스코트가 나타나는 때(ms). 제목 타이핑이 거의 끝날 즈음 이어진다
export const SUBTITLE_DELAY_MS = 1100;
export const MASCOT_DELAY_MS = 1400;

// 움직임 줄이기를 켰거나 이미 본 사람에게는 효과 없이 바로 보여준다
export const shouldSkipLoginIntro = () => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return true;
  }
  try {
    return window.sessionStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
};

export const markLoginIntroSeen = () => {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, 'true');
  } catch {
    // 저장소를 쓸 수 없으면 다음에도 보여준다
  }
};
