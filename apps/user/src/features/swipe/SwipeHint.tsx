import { useEffect, useState } from 'react';

import { fetchTodayIssuance } from '@user/api/coupon';
import { useOpenCountdown } from '@user/features/wishlist/useOpenCountdown';

interface TodayIssuance {
  issuedCount: number;
  dailyLimit: number;
}

// 오픈 뒤에 보여줄 안내. 하루 한도를 다 채웠으면 더 찜해도 오늘은 받을 수 없다고 알려준다
const getOpenHint = (issuance: TodayIssuance | null) => {
  if (!issuance) return '쿠폰 오픈 · 찜 목록에서 바로 받을 수 있어요';

  const { dailyLimit, issuedCount } = issuance;
  if (issuedCount >= dailyLimit) {
    return `오늘 ${dailyLimit}장을 모두 받았어요 · 내일 다시 받을 수 있어요`;
  }
  return `오늘 받은 쿠폰 ${issuedCount}/${dailyLimit}장 · 찜 목록에서 바로 받을 수 있어요`;
};

// 카드 아래 안내. 11:00 오픈 전에는 찜이 무엇인지, 오픈 뒤에는 오늘 받은 쿠폰 수를 알려준다
const SwipeHint = () => {
  const { isOpen } = useOpenCountdown();
  // 오픈 뒤에만 불러온다. 불러오기 전이거나 실패하면 수 없이 안내한다
  const [issuance, setIssuance] = useState<TodayIssuance | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    let ignore = false;
    fetchTodayIssuance()
      .then((result) => {
        if (!ignore) setIssuance(result);
      })
      .catch(() => {});

    // 응답 전에 화면을 벗어나면 결과를 버린다
    return () => {
      ignore = true;
    };
  }, [isOpen]);

  return (
    // 로딩 중에도 보여서 카드가 뜰 때 위치가 들썩이지 않게 한다
    <p className="mt-1 text-center text-caption-mobile text-text-secondary">
      {isOpen
        ? getOpenHint(issuance)
        : '찜은 발급 전 단계예요 · 11:00부터 찜 목록에서 받기'}
    </p>
  );
};

export default SwipeHint;
