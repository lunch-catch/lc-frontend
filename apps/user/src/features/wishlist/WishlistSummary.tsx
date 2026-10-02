interface WishlistSummaryProps {
  title: string;
  dailyRemaining: number;
  dailyLimit: number;
}

// 찜 목록 맨 위의 발급 상황 요약과 하루 남은 발급 횟수
const WishlistSummary = ({
  dailyLimit,
  dailyRemaining,
  title,
}: WishlistSummaryProps) => {
  return (
    <section className="flex flex-col gap-1.5">
      <h2 className="text-h2-mobile font-bold text-text-primary">{title}</h2>
      <p className="text-caption-mobile text-text-secondary">
        {dailyRemaining > 0
          ? `오늘 ${dailyRemaining}개 더 받을 수 있어요`
          : '오늘 남은 발급 0개'}
        {` · 하루 최대 ${dailyLimit}개`}
      </p>
      <p className="text-caption-mobile text-text-secondary">
        찜은 발급을 보장하지 않아요. 오픈 후 선착순이에요.
      </p>
    </section>
  );
};

export default WishlistSummary;
