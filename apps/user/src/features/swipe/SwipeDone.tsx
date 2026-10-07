import { useNavigate } from 'react-router';

import mascotAlert from '@user/assets/illustrations/mascot-alert.webp';
import ActionButton from '@user/components/ActionButton/ActionButton';
import EmptyState from '@user/components/EmptyState/EmptyState';

// 오늘의 포스터를 모두 넘겼을 때 보여주는 화면
// 넘긴 포스터는 찜이든 패스든 그날 다시 나오지 않아서 처음부터 다시 보기는 두지 않는다
const SwipeDone = () => {
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
      <ActionButton onClick={() => navigate('/explore')} variant="ghost">
        주변 가게 둘러보기
      </ActionButton>
    </EmptyState>
  );
};

export default SwipeDone;
