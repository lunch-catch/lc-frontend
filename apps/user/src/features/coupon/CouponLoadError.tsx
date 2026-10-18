import { cardClassName } from '@user/ui/Card/Card';

// 쿠폰 목록을 불러오지 못했을 때 목록 자리에 두는 안내와 다시 시도 버튼
const CouponLoadError = ({ onRetry }: { onRetry: () => void }) => (
  <div
    className={`flex items-center justify-between gap-3 px-4 py-4 ${cardClassName}`}
  >
    <p className="text-body-sm-mobile text-text-secondary">
      쿠폰을 불러오지 못했어요
    </p>
    <button
      className="h-9 shrink-0 rounded-lg border border-border-subtle px-3 text-body-sm-mobile font-bold text-text-primary active:bg-surface-subtle focus-visible:outline-2 focus-visible:outline-action-primary"
      onClick={onRetry}
      type="button"
    >
      다시 시도
    </button>
  </div>
);

export default CouponLoadError;
