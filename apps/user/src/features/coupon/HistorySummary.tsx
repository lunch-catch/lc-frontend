import mascotHistoryEmpty from '@user/assets/illustrations/mascot-history-empty.webp';

import { formatPrice } from './couponFormat';

interface HistorySummaryProps {
  // 지금까지 사용한 쿠폰 수와 아낀 금액 (쿠폰 요약의 누적 값)
  usedCount: number;
  savedAmount: number;
}

// 사용 내역 맨 위의 누적 요약 배너
// 찜 목록 맨 위 배너와 같은 연한 주황 칸과 오른쪽 마스코트로 두어 쿠폰함 탭끼리 맨 위 모양을 맞춘다
// 목록은 기록이라 담담하게 두고, 배너에서 쿠폰을 써서 아낀 금액을 먼저 보여준다
const HistorySummary = ({ savedAmount, usedCount }: HistorySummaryProps) => (
  <section className="flex items-center gap-3 overflow-hidden rounded-2xl bg-surface-brand px-4 py-3">
    <div className="flex min-w-0 flex-1 flex-col gap-1">
      <h2 className="text-h3-mobile font-bold text-text-primary">
        {savedAmount > 0 ? (
          <>
            지금까지{' '}
            <span className="text-text-brand">{formatPrice(savedAmount)}</span>{' '}
            아꼈어요
          </>
        ) : (
          '쿠폰을 쓰면 아낀 금액이 쌓여요'
        )}
      </h2>
      <p className="text-caption-mobile text-text-secondary">
        쿠폰 {usedCount}번 사용
      </p>
    </div>
    <img
      alt=""
      className="size-14 shrink-0 object-contain"
      height={56}
      src={mascotHistoryEmpty}
      width={56}
    />
  </section>
);

export default HistorySummary;
