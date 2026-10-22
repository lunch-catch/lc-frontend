import { useNavigate } from 'react-router';

import mascotAlert from '@user/assets/illustrations/mascot-alert.webp';
import mascotDefault from '@user/assets/illustrations/mascot-default.webp';
import ActionButton from '@user/ui/ActionButton/ActionButton';
import EmptyState from '@user/ui/EmptyState/EmptyState';

// 탈퇴하지 못한 이유
// cancelled: 카카오 화면에서 취소했거나 다른 탭에서 시작함, reauth: 다른 카카오 계정으로 확인함, server: 서버 오류
export type WithdrawFailure = 'cancelled' | 'reauth' | 'server';

// 첫 줄은 무슨 일인지, 둘째 줄은 어떻게 하면 되는지
const failureDescriptions: Record<WithdrawFailure, [string, string]> = {
  cancelled: ['카카오 계정 확인이 끝나지 않았어요', '다시 시도해 주세요'],
  reauth: [
    '카카오 계정 확인에 실패했어요',
    '지금 로그인한 계정으로 다시 확인해 주세요',
  ],
  server: ['지금은 탈퇴할 수 없어요', '잠시 후 다시 시도해 주세요'],
};

interface WithdrawStatusScreenProps {
  status: 'loading' | 'error';
  failure: WithdrawFailure;
}

// 카카오 재인증에서 돌아와 탈퇴를 처리하는 동안과 실패했을 때 보여주는 화면
const WithdrawStatusScreen = ({
  failure,
  status,
}: WithdrawStatusScreenProps) => {
  const navigate = useNavigate();

  if (status === 'loading') {
    return (
      <div className="mx-auto flex min-h-dvh max-w-mobile flex-col bg-bg-page">
        <EmptyState image={mascotDefault} title="탈퇴하는 중이에요" />
        {/* 화면 읽기 프로그램이 진행 상황을 바로 읽도록 알린다 */}
        <p className="sr-only" role="status">
          탈퇴하는 중이에요
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-mobile flex-col bg-bg-page">
      <EmptyState
        description={
          <>
            {failureDescriptions[failure][0]}
            <br />
            {failureDescriptions[failure][1]}
          </>
        }
        image={mascotAlert}
        title="탈퇴하지 못했어요"
      >
        <ActionButton
          onClick={() => navigate('/my/settings', { replace: true })}
          size="large"
        >
          설정으로 돌아가기
        </ActionButton>
      </EmptyState>
    </div>
  );
};

export default WithdrawStatusScreen;
