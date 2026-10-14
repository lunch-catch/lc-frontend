import { useNavigate } from 'react-router';

import mascotAlert from '@user/assets/illustrations/mascot-alert.webp';
import mascotDefault from '@user/assets/illustrations/mascot-default.webp';
import ActionButton from '@user/components/ActionButton/ActionButton';
import EmptyState from '@user/components/EmptyState/EmptyState';

interface WithdrawStatusScreenProps {
  status: 'loading' | 'error';
}

// 카카오 재인증에서 돌아와 탈퇴를 처리하는 동안과 실패했을 때 보여주는 화면
const WithdrawStatusScreen = ({ status }: WithdrawStatusScreenProps) => {
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
        description="카카오 계정 확인이 끝나지 않았어요 · 다시 시도해 주세요"
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
