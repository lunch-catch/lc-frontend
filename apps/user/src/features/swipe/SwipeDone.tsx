import { useNavigate } from 'react-router';

import mascotAlert from '@user/assets/illustrations/mascot-alert.webp';
import ActionButton from '@user/components/ActionButton/ActionButton';
import EmptyState from '@user/components/EmptyState/EmptyState';

interface SwipeDoneProps {
  onRestart: () => void;
}

// 오늘의 포스터를 모두 넘겼을 때 보여주는 화면
const SwipeDone = ({ onRestart }: SwipeDoneProps) => {
  const navigate = useNavigate();

  return (
    <EmptyState
      description="마음에 든 포스터는 찜 목록에서 다시 볼 수 있어요"
      image={mascotAlert}
      title="오늘의 포스터를 모두 확인했어요"
    >
      <ActionButton onClick={() => navigate('/coupons/wishlist')}>
        찜한 포스터 보기
      </ActionButton>
      <ActionButton onClick={onRestart} variant="ghost">
        처음부터 다시 보기
      </ActionButton>
    </EmptyState>
  );
};

export default SwipeDone;
