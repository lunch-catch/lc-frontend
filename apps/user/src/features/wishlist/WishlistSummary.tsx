import type { ReactNode } from 'react';

import mascotCoupon from '@user/assets/illustrations/mascot-coupon.webp';
import mascotDone from '@user/assets/illustrations/mascot-done.webp';

interface WishlistSummaryProps {
  title: ReactNode;
  dailyRemaining: number;
  dailyLimit: number;
  // 오픈 전인지. 오픈 전에는 남은 횟수 대신 찜이 발급을 보장하지 않는다고 알려준다
  showNotice: boolean;
  // 14:00 발급 마감이 지났는지. 지났으면 오늘 남은 횟수 대신 다음 오픈을 알려준다
  isClosed?: boolean;
}

// 찜 목록 맨 위의 오늘 발급 상황 배너
// 다른 화면 제목과 같은 글자만 두면 아래 카드와 섞여 보여서, 연한 브랜드 바탕에 할인 쿠폰을 든 마스코트를 둔 배너로 묶는다
// 마스코트는 정면을 봐서 오른쪽에 두어도 배너 밖으로 나가는 것처럼 보이지 않는다
// 방금 줄인 카드가 밀려 내려가지 않도록 예전 제목 영역과 비슷한 높이로 낮게 둔다
const WishlistSummary = ({
  dailyLimit,
  dailyRemaining,
  isClosed = false,
  showNotice,
  title,
}: WishlistSummaryProps) => {
  const getDescription = () => {
    if (isClosed) return '찜해 둔 쿠폰은 내일 11:00부터 받을 수 있어요';
    // 제목(쿠폰 오픈까지)에 이어 읽히게, 오픈하면 어디서 어떻게 받는지를 한 줄로 알린다
    // "선착순"으로 찜이 발급을 보장하지 않는다는 뜻을 부정적인 말 없이 전한다
    // 두 줄로 나누면 줄마다 짧아 마스코트와의 사이가 비어 보여서, 좁은 화면(320px)에서도 한 줄에 들어가게 둔다
    if (showNotice) return '오픈하면 여기서 선착순으로 받아요';
    if (dailyRemaining === 0) return '내일 11:00에 또 만나요';
    return `오늘 ${dailyRemaining}개 더 받을 수 있어요 · 하루 최대 ${dailyLimit}개`;
  };
  // 오늘은 더 받을 수 없는 때(14:00 마감 뒤, 하루 한도를 다 채움)는 상자를 닫는 마스코트로 바꿔 그림만 봐도 오늘은 끝났다는 걸 알린다
  const isDoneForToday = isClosed || (!showNotice && dailyRemaining === 0);
  return (
    <section className="flex items-center gap-3 overflow-hidden rounded-2xl bg-surface-brand px-4 py-3">
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <h2 className="flex items-center gap-1.5 text-h3-mobile font-bold text-text-primary">
          {title}
        </h2>
        {/* 화면이 아주 좁아 넘치면 단어 중간이 아니라 띄어쓰기에서 끊는다 */}
        <p className="text-caption-mobile break-keep text-text-secondary">
          {getDescription()}
        </p>
      </div>
      <img
        alt=""
        className="size-14 shrink-0 object-contain"
        height={56}
        src={isDoneForToday ? mascotDone : mascotCoupon}
        width={56}
      />
    </section>
  );
};

export default WishlistSummary;
