import { useNavigate } from 'react-router';

import mascotAlert from '@user/assets/illustrations/mascot-alert.webp';
import ActionButton from '@user/components/ActionButton/ActionButton';
import EmptyState from '@user/components/EmptyState/EmptyState';

// 서빙 시간대(10:00~12:59) 밖에 피드 대신 보여주는 화면
const SwipeClosed = () => {
  const navigate = useNavigate();

  return (
    <EmptyState
      description={
        <>
          피드는 매일 10:00–12:59에 열려요.
          <br />
          찜한 캠페인과 받은 쿠폰은 계속 확인할 수 있어요.
        </>
      }
      image={mascotAlert}
      title="내일 10시에 만나요"
    >
      <ActionButton onClick={() => navigate('/wishlist')}>
        찜한 포스터 보기
      </ActionButton>
    </EmptyState>
  );
};

export default SwipeClosed;
