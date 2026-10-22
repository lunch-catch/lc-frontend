// 피드를 불러오는 동안 포스터 카드 자리에 보여주는 회색 틀 (Figma Swipe Poster · Loading)
const PosterSkeleton = () => {
  return (
    <div
      aria-hidden="true"
      className="flex flex-1 animate-pulse flex-col overflow-hidden rounded-lg bg-bg-surface shadow-[0_8px_16px_rgba(47,42,39,0.1)] dark:border dark:border-border-subtle motion-reduce:animate-none"
    >
      {/* 카드에 포스터만 있어서 회색 틀도 포스터 자리 하나만 둔다 */}
      <div className="min-h-56 flex-1 bg-surface-subtle" />
    </div>
  );
};

export default PosterSkeleton;
