import { useNavigate } from 'react-router';

import mascotEmpty from '@user/assets/illustrations/mascot-empty.webp';
import ActionButton from '@user/components/ActionButton/ActionButton';
import EmptyState from '@user/components/EmptyState/EmptyState';

// 찜한 캠페인이 하나도 없을 때 피드로 안내하는 화면
const WishlistEmpty = () => {
  const navigate = useNavigate();

  return (
    <EmptyState
      description="스와이프에서 마음에 드는 포스터를 찜해 보세요"
      image={mascotEmpty}
      title="아직 찜한 캠페인이 없어요"
    >
      <ActionButton onClick={() => navigate('/swipe')}>
        점심 포스터 보기
      </ActionButton>
    </EmptyState>
  );
};

export default WishlistEmpty;
