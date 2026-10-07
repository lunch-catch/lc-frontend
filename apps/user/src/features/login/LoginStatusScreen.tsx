import mascotError from '@user/assets/illustrations/mascot-error.webp';
import mascotLoading from '@user/assets/illustrations/mascot-loading.webp';
import Wordmark from '@user/components/Wordmark/Wordmark';

import KakaoLoginButton from './KakaoLoginButton';

export const loginScreenClassName =
  'mx-auto flex min-h-dvh max-w-mobile flex-col bg-bg-page px-page pt-3 pb-[max(16px,env(safe-area-inset-bottom))]';

// 로그인 중 점 세 개가 차례로 깜빡이도록 시작을 조금씩 늦춘다
const loadingDotDelays = [
  '[animation-delay:0ms]',
  '[animation-delay:200ms]',
  '[animation-delay:400ms]',
];

interface LoginStatusScreenProps {
  status: 'loading' | 'error';
  onRetry: () => void;
}

// 카카오 로그인 중과 실패 화면. 로그인 버튼을 누른 직후와 카카오에서 돌아온 뒤에 함께 쓴다
const LoginStatusScreen = ({ onRetry, status }: LoginStatusScreenProps) => {
  // 로그인 중 화면은 잠깐 지나가므로 글은 작은 상태 문구 한 줄만 두고, 떠다니는 마스코트와 점으로 진행 중임을 보여준다
  // 움직임 줄이기 설정을 켠 사용자에게는 모두 멈춘 모습으로 보여준다
  if (status === 'loading') {
    return (
      <main className={loginScreenClassName}>
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
    <main className={loginScreenClassName}>
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
      <KakaoLoginButton onClick={onRetry}>
        카카오로 다시 시도하기
      </KakaoLoginButton>
    </main>
  );
};

export default LoginStatusScreen;
