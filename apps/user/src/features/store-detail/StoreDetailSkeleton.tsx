import { ChevronLeft } from 'lucide-react';

interface StoreDetailSkeletonProps {
  onBack: () => void;
}

// 가게 정보를 불러오는 동안 보여주는 회색 틀. 잘못 들어왔을 때 바로 나갈 수 있게 뒤로 가기는 둔다
const StoreDetailSkeleton = ({ onBack }: StoreDetailSkeletonProps) => {
  return (
    <div className="mx-auto flex min-h-dvh max-w-mobile flex-col bg-bg-page">
      <div className="relative h-60 bg-surface-subtle">
        <button
          aria-label="뒤로 가기"
          className="absolute top-[max(12px,env(safe-area-inset-top))] left-3 flex size-10 items-center justify-center rounded-full bg-black/40 text-white"
          onClick={onBack}
          type="button"
        >
          <ChevronLeft aria-hidden="true" className="size-6" />
        </button>
      </div>
      <div
        aria-hidden="true"
        className="flex animate-pulse flex-col gap-3 px-page pt-5 motion-reduce:animate-none"
      >
        <div className="h-7 w-40 rounded-sm bg-surface-subtle" />
        <div className="h-5 w-28 rounded-sm bg-surface-subtle/60" />
        <div className="mt-2 h-18 rounded-xl bg-surface-subtle/60" />
        <div className="mt-5 h-32 rounded-xl bg-surface-subtle" />
      </div>
    </div>
  );
};

export default StoreDetailSkeleton;
