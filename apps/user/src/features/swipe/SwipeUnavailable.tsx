import { useNavigate } from 'react-router';

import mascotEmpty from '@user/assets/illustrations/mascot-empty.webp';
import mascotError from '@user/assets/illustrations/mascot-error.webp';
import ActionButton from '@user/ui/ActionButton/ActionButton';
import EmptyState from '@user/ui/EmptyState/EmptyState';

// empty: 주변에 오늘 보여줄 카드가 없음, needsLocation: 저장한 위치가 없음, error: 피드를 받지 못함
export type SwipeUnavailableReason = 'empty' | 'needsLocation' | 'error';

interface SwipeUnavailableProps {
  reason: SwipeUnavailableReason;
  onRetry: () => void;
  // 피드 필터에 업종을 골라 둔 상태면 넘긴다. 카드가 없을 때 업종 필터를 풀어 다시 받는다
  onShowAllCategories?: () => void;
  // 업종 필터를 푸는 중인지
  isClearingFilter?: boolean;
}

// 카드를 보여줄 수 없을 때 피드 대신 보여주는 화면
const SwipeUnavailable = ({
  isClearingFilter = false,
  onRetry,
  onShowAllCategories,
  reason,
}: SwipeUnavailableProps) => {
  const navigate = useNavigate();

  // 업종을 골라 둔 채 카드가 없으면 주변에 쿠폰이 아예 없는 것처럼 보이지 않게, 필터 때문일 수 있다고 알리고 바로 풀게 한다
  if (reason === 'empty' && onShowAllCategories) {
    return (
      <EmptyState
        description="필터를 풀면 다른 업종 쿠폰도 볼 수 있어요"
        image={mascotEmpty}
        title="고른 업종에 오늘 쿠폰이 없어요"
      >
        <ActionButton loading={isClearingFilter} onClick={onShowAllCategories}>
          전체 업종 보기
        </ActionButton>
      </EmptyState>
    );
  }

  if (reason === 'needsLocation') {
    return (
      <EmptyState
        description="설정한 위치 주변 가게의 쿠폰을 보여드려요"
        image={mascotEmpty}
        title="위치를 설정해 주세요"
      >
        <ActionButton onClick={() => navigate('/my/location')}>
          위치 설정하기
        </ActionButton>
      </EmptyState>
    );
  }

  if (reason === 'empty') {
    return (
      <EmptyState
        description="다른 위치를 설정하거나 탐색에서 가게를 둘러보세요"
        image={mascotEmpty}
        title="주변에 오늘 쿠폰이 없어요"
      >
        <ActionButton onClick={() => navigate('/explore')}>
          주변 가게 보기
        </ActionButton>
        <ActionButton onClick={() => navigate('/my/location')} variant="ghost">
          위치 바꾸기
        </ActionButton>
      </EmptyState>
    );
  }

  return (
    <EmptyState
      description="잠시 후 다시 시도해 주세요"
      image={mascotError}
      title="포스터를 불러오지 못했어요"
    >
      <ActionButton onClick={onRetry}>다시 시도</ActionButton>
    </EmptyState>
  );
};

export default SwipeUnavailable;
