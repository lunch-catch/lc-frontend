const SKELETON_CARD_COUNT = 2;

// 찜 목록과 발급 상태를 불러오는 동안 요약과 카드 자리에 보여주는 회색 틀
const WishlistSkeleton = () => {
  return (
    <div
      aria-hidden="true"
      className="flex animate-pulse flex-col gap-4 motion-reduce:animate-none"
    >
      <div className="flex flex-col gap-2.5">
        <div className="h-7 w-52 rounded-md bg-surface-subtle" />
        <div className="h-4 w-60 rounded-sm bg-surface-subtle/60" />
        <div className="h-4 w-72 rounded-sm bg-surface-subtle/60" />
      </div>
      {Array.from({ length: SKELETON_CARD_COUNT }, (_, index) => (
        <div
          className="flex flex-col gap-3 rounded-xl border border-border-subtle bg-bg-surface p-4"
          key={index}
        >
          <div className="flex items-center gap-3">
            <div className="size-18 shrink-0 rounded-lg bg-surface-subtle" />
            <div className="flex flex-1 flex-col gap-2">
              <div className="h-5 w-24 rounded-sm bg-surface-subtle" />
              <div className="h-4 w-32 rounded-sm bg-surface-subtle/60" />
              <div className="h-4 w-28 rounded-sm bg-surface-subtle/60" />
            </div>
          </div>
          <div className="h-4 w-36 rounded-sm bg-surface-subtle/60" />
          <div className="h-12 rounded-lg bg-surface-subtle" />
        </div>
      ))}
    </div>
  );
};

export default WishlistSkeleton;
