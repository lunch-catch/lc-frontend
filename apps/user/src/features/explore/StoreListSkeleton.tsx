const SKELETON_CARD_COUNT = 4;

// 가게 목록을 불러오는 동안 카드 자리에 보여주는 회색 틀
const StoreListSkeleton = () => {
  return (
    <div
      aria-hidden="true"
      className="flex animate-pulse flex-col gap-3 motion-reduce:animate-none"
    >
      {Array.from({ length: SKELETON_CARD_COUNT }, (_, index) => (
        <div
          className="flex items-center gap-3 rounded-xl border border-border-subtle bg-bg-surface p-3"
          key={index}
        >
          <div className="size-18 shrink-0 rounded-lg bg-surface-subtle" />
          <div className="flex flex-1 flex-col gap-2">
            <div className="h-5 w-28 rounded-sm bg-surface-subtle" />
            <div className="h-4 w-20 rounded-sm bg-surface-subtle/60" />
            <div className="h-5 w-24 rounded-sm bg-surface-subtle/60" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default StoreListSkeleton;
