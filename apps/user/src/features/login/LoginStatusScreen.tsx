import { LoaderCircle } from 'lucide-react';

import mascotError from '@user/assets/illustrations/mascot-error.webp';
import mascotLoading from '@user/assets/illustrations/mascot-loading.webp';
import Wordmark from '@user/ui/Wordmark/Wordmark';

import KakaoLoginButton from './KakaoLoginButton';

export const loginScreenClassName =
  'mx-auto flex min-h-dvh max-w-mobile flex-col bg-bg-page px-page pt-3 pb-[max(16px,env(safe-area-inset-bottom))]';

interface LoginStatusScreenProps {
  status: 'loading' | 'error';
  failure: LoginFailure;
  onRetry: () => void;
}

export type LoginFailure =
  | 'authentication'
  | 'suspended'
  | 'pendingUnlink'
  | 'service'
  | 'rateLimited'
  | 'network';

const failureMessages: Record<LoginFailure, string> = {
  authentication: '카카오 인증에 실패했어요 · 다시 로그인해 주세요',
  suspended: '이용할 수 없는 계정이에요',
  pendingUnlink: '이전 계정 처리가 끝나지 않았어요 · 나중에 다시 시도해 주세요',
  service: '지금은 로그인할 수 없어요 · 잠시 후 다시 시도해 주세요',
  rateLimited: '로그인 요청이 많아요 · 잠시 후 다시 시도해 주세요',
  network: '네트워크 상태를 확인한 뒤 다시 시도해 주세요',
};

// 카카오 로그인 중과 실패 화면
// 로그인 중은 카카오에서 돌아와 서버가 로그인을 마치는 동안만 보인다. 버튼을 누른 직후에는 로그인 화면의 버튼만 로딩으로 바뀐다
// 로고는 로그인 화면과 같은 왼쪽 위에 두어 화면이 바뀔 때 들썩이지 않게 하고,
// 마스코트와 글자 크기는 빈 화면(EmptyState)과 같게 맞춘다 (마스코트 80px, 제목 16px, 설명 13px)
const LoginStatusScreen = ({
  failure,
  onRetry,
  status,
}: LoginStatusScreenProps) => {
  const isLoading = status === 'loading';

  return (
    <main className={loginScreenClassName}>
      <Wordmark />
      {/* 정확한 가운데는 눈에 조금 아래로 보여서, 아래 여백을 더 주어 묶음을 살짝 위로 올린다 */}
      <div className="flex flex-1 flex-col items-center justify-center pt-6 pb-20 text-center">
        <img
          alt=""
          className="size-20"
          height={80}
          src={isLoading ? mascotLoading : mascotError}
          width={80}
        />
        {/* 화면 읽기 프로그램이 로그인 진행과 실패를 바로 읽도록 알린다 */}
        <div aria-live="polite" className="mt-4">
          <h1 className="text-h3-mobile font-bold text-text-primary">
            {isLoading ? '로그인하고 있어요' : '로그인하지 못했어요'}
          </h1>
          {isLoading ? (
            // 잠깐 지나가는 화면이라 글은 한 줄만 두고, 잘 보이는 주황 로딩 표시로 진행 중임을 알린다
            <LoaderCircle
              aria-hidden="true"
              className="mx-auto mt-3 size-5 animate-spin text-action-primary motion-reduce:animate-none"
            />
          ) : (
            <p className="mt-1.5 text-body-sm-mobile text-text-secondary">
              {failureMessages[failure]}
            </p>
          )}
        </div>
      </div>
      {/* 실패하면 로그인 화면과 같은 자리에 다시 시도 버튼을 둔다
          로그인 중에도 버튼 높이만큼 빈칸을 두어, 실패로 바뀔 때 마스코트가 위로 들썩이지 않게 한다 */}
      {isLoading ? (
        <div aria-hidden="true" className="h-13" />
      ) : (
        <KakaoLoginButton onClick={onRetry}>
          카카오로 다시 시도하기
        </KakaoLoginButton>
      )}
    </main>
  );
};

export default LoginStatusScreen;
