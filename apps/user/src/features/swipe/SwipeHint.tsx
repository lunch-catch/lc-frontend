import { useEffect, useState } from 'react';

import { fetchTodayIssuance } from '@user/api/coupon';
import { useOpenCountdown } from '@user/hooks/useOpenCountdown';

interface TodayIssuance {
  issuedCount: number;
  dailyLimit: number;
}

// 안내 문구. 카드 폭이 좁은 작은 화면에서는 두 줄로 꺾이지 않게 짧은 문구를 쓴다
interface Hint {
  long: string;
  short: string;
}

// 오픈 전과 마감 뒤는 같은 틀로 두어, 언제 받는지만 바뀌는 게 보이게 한다
// 받는 곳(찜 목록)은 찜한 뒤 토스트와 찜 목록 화면이 알려줘서 여기서는 받는 때만 말한다
const BEFORE_OPEN_HINT: Hint = {
  long: '찜해 두면 11:00부터 쿠폰을 받을 수 있어요',
  short: '11:00부터 쿠폰을 받을 수 있어요',
};

// 14:00 발급 마감 뒤에도 피드는 열려 있어, 지금 찜하면 내일 오픈에 받는다고 알려준다
// 오후에 '11:00'만 쓰면 이미 지난 오늘 11:00로 읽힐 수 있어 '내일'을 넣는다
const AFTER_CLOSE_HINT: Hint = {
  long: '찜해 두면 내일 11:00부터 쿠폰을 받을 수 있어요',
  short: '내일 11:00부터 쿠폰을 받을 수 있어요',
};

// 오픈 뒤에 보여줄 안내. 하루 한도를 다 채웠으면 더 찜해도 오늘은 받을 수 없다고 알려준다
const getOpenHint = (issuance: TodayIssuance | null): Hint => {
  if (!issuance) {
    return {
      long: '쿠폰 오픈 · 찜 목록에서 바로 받을 수 있어요',
      short: '찜 목록에서 바로 받을 수 있어요',
    };
  }

  const { dailyLimit, issuedCount } = issuance;
  if (issuedCount >= dailyLimit) {
    return {
      long: `오늘 ${dailyLimit}장을 모두 받았어요 · 내일 다시 받을 수 있어요`,
      short: `오늘 ${dailyLimit}장을 모두 받았어요`,
    };
  }
  return {
    long: `오늘 받은 쿠폰 ${issuedCount}/${dailyLimit}장 · 찜 목록에서 바로 받을 수 있어요`,
    short: `오늘 받은 쿠폰 ${issuedCount}/${dailyLimit}장 · 찜 목록에서 받아요`,
  };
};

// 카드 아래 안내. 11:00 오픈 전에는 찜하면 언제 받는지, 발급 중에는 오늘 받은 쿠폰 수를, 마감 뒤에는 다음 오픈을 알려준다
const SwipeHint = () => {
  const { isIssueClosed, isOpen } = useOpenCountdown();
  const isIssuing = isOpen && !isIssueClosed;
  // 발급 중에만 불러온다. 불러오기 전이거나 실패하면 수 없이 안내한다
  const [issuance, setIssuance] = useState<TodayIssuance | null>(null);

  useEffect(() => {
    if (!isIssuing) return;

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
  }, [isIssuing]);

  const getHint = () => {
    if (isIssueClosed) return AFTER_CLOSE_HINT;
    return isOpen ? getOpenHint(issuance) : BEFORE_OPEN_HINT;
  };
  const hint = getHint();

  return (
    // 로딩 중에도 보여서 카드가 뜰 때 위치가 들썩이지 않게 한다
    // 한 줄로만 두어 포스터 높이를 덜 빼앗는다. 카드 폭(@container)이 19rem보다 좁으면 짧은 문구를 쓴다
    <p className="mt-1 truncate text-center text-caption-mobile text-text-secondary">
      <span className="@[19rem]:hidden">{hint.short}</span>
      <span className="hidden @[19rem]:inline">{hint.long}</span>
    </p>
  );
};

export default SwipeHint;
