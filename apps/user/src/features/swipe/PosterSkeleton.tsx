// 피드를 불러오는 동안 포스터 카드 자리에 보여주는 회색 틀 (Figma Swipe Poster · Loading)
const PosterSkeleton = () => {
  return (
    <div
      aria-hidden="true"
      className="flex flex-1 animate-pulse flex-col overflow-hidden rounded-lg bg-bg-surface shadow-[0_8px_16px_rgba(47,42,39,0.1)] motion-reduce:animate-none"
    >
      <div className="min-h-56 flex-1 bg-surface-subtle" />
      <div className="px-4.5 py-3">
        <div className="h-6 w-36 rounded-md bg-surface-subtle" />
        <div className="mt-1 h-4.5 w-52 rounded-sm bg-surface-subtle/60" />
      </div>
    </div>
  );
};

export default PosterSkeleton;
