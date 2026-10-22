import { useEffect, useState } from 'react';

import { getNow } from '@user/api/clock';
import mascotLoading from '@user/assets/illustrations/mascot-loading.webp';
import EmptyState from '@user/ui/EmptyState/EmptyState';

interface SwipeWaitingProps {
  // 새 카드를 받을 시각 (이 휴대폰 시계 기준 ms)
  until: number;
}

const getRemainingSeconds = (until: number) =>
  Math.max(0, Math.ceil((until - getNow()) / 1000));

// 카드를 다 넘겼거나 요청이 몰려 잠시 기다릴 때 보여주는 화면. 시간이 되면 피드 화면이 알아서 새 카드를 받는다
const SwipeWaiting = ({ until }: SwipeWaitingProps) => {
  const [remainingSeconds, setRemainingSeconds] = useState(() =>
    getRemainingSeconds(until),
  );

  useEffect(() => {
    const timer = setInterval(
      () => setRemainingSeconds(getRemainingSeconds(until)),
      1000,
    );
    return () => clearInterval(timer);
  }, [until]);

  return (
    <EmptyState
      description="넘긴 카드는 찜이든 패스든 오늘 다시 나오지 않아요"
      image={mascotLoading}
      title={
        remainingSeconds > 0
          ? `${remainingSeconds}초 후 새 카드`
          : '새 카드를 불러오고 있어요'
      }
    />
  );
};

export default SwipeWaiting;
