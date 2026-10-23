// 가까운 순 쿠폰 슬라이드를 불러오는 동안 보여주는 회색 틀. 실제 슬라이드처럼 가운데 카드와 양옆 카드를 같은 16:9 높이로 잡아 둔다
const NearbyCouponSliderSkeleton = () => (
  <div
    aria-hidden="true"
    className="flex animate-pulse flex-col gap-2 motion-reduce:animate-none"
  >
    <div className="mb-1 h-5 w-28 rounded-sm bg-surface-subtle" />
    <div className="relative -mx-page overflow-hidden py-1">
      <div className="mx-auto aspect-video w-[76%]" />
      <div className="absolute top-1 left-1/2 aspect-video w-[76%] -translate-x-1/2 rounded-2xl bg-surface-subtle" />
      <div className="absolute top-1 left-1/2 aspect-video w-[76%] translate-x-[calc(-150%-12px)] scale-[0.92] rounded-2xl bg-surface-subtle/60" />
      <div className="absolute top-1 left-1/2 aspect-video w-[76%] translate-x-[calc(50%+12px)] scale-[0.92] rounded-2xl bg-surface-subtle/60" />
    </div>
    <div className="h-6" />
  </div>
);

export default NearbyCouponSliderSkeleton;
