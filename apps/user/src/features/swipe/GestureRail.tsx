import { Heart, X } from 'lucide-react';

interface GestureRailProps {
  storeName: string;
  onPass: () => void;
  onWish: () => void;
}

const actionButtonClassName =
  'flex h-14 w-22 items-center justify-center gap-1.5 rounded-lg text-caption-mobile font-medium text-text-secondary active:bg-surface-subtle focus-visible:outline-2 focus-visible:outline-action-primary';

// 포스터 아래 패스 / 찜 버튼과 좌우로 밀 수 있다는 안내
const GestureRail = ({ onPass, onWish, storeName }: GestureRailProps) => {
  return (
    <div className="flex h-16 items-center justify-between">
      <button
        aria-label={`${storeName} 패스`}
        className={actionButtonClassName}
        onClick={onPass}
        type="button"
      >
        <X aria-hidden="true" className="size-4" />
        패스
      </button>
      <div aria-hidden="true" className="flex flex-col items-center gap-2">
        <span className="text-caption-mobile text-text-tertiary">
          ← 밀어서 선택 →
        </span>
        <span className="h-0.5 w-34 rounded-full bg-border-subtle" />
      </div>
      <button
        aria-label={`${storeName} 찜하기`}
        className={actionButtonClassName}
        onClick={onWish}
        type="button"
      >
        찜
        <Heart aria-hidden="true" className="size-4" />
      </button>
    </div>
  );
};

export default GestureRail;
