import { Heart, X } from 'lucide-react';

import type { SwipeAction } from '@user/api/feed';

interface GestureRailProps {
  storeName: string;
  // 카드를 끌고 있는 방향. 끌지 않으면 null
  direction: SwipeAction | null;
  onPass: () => void;
  onWish: () => void;
}

const actionButtonClassName =
  'flex h-14 w-22 items-center justify-center gap-1.5 rounded-lg text-caption-mobile transition-colors active:bg-surface-subtle focus-visible:outline-2 focus-visible:outline-action-primary';

const hintByDirection = {
  wish: {
    label: '오른쪽으로 밀기 →',
    textClassName: 'font-bold text-like',
    trackClassName: 'bg-like',
    dotClassName: 'right-0 bg-like',
  },
  pass: {
    label: '← 왼쪽으로 밀기',
    textClassName: 'font-bold text-text-primary',
    trackClassName: 'bg-text-primary',
    dotClassName: 'left-0 bg-text-primary',
  },
  none: {
    label: '← 밀어서 선택 →',
    textClassName: 'text-text-tertiary',
    trackClassName: 'bg-border-subtle',
    dotClassName: 'hidden',
  },
};

// 포스터 아래 패스 / 찜 버튼과 좌우로 밀 수 있다는 안내
const GestureRail = ({
  direction,
  onPass,
  onWish,
  storeName,
}: GestureRailProps) => {
  const hint = hintByDirection[direction ?? 'none'];

  return (
    <div className="flex h-16 items-center justify-between">
      <button
        aria-label={`${storeName} 패스`}
        className={`${actionButtonClassName} ${
          direction === 'pass'
            ? 'font-bold text-text-primary'
            : 'font-medium text-text-secondary'
        }`}
        onClick={onPass}
        type="button"
      >
        <X aria-hidden="true" className="size-4" />
        패스
      </button>
      <div aria-hidden="true" className="flex flex-col items-center gap-2">
        <span className={`text-caption-mobile ${hint.textClassName}`}>
          {hint.label}
        </span>
        <span
          className={`relative h-0.5 w-34 rounded-full ${hint.trackClassName}`}
        >
          <span
            className={`absolute -top-0.5 size-1.5 rounded-full ${hint.dotClassName}`}
          />
        </span>
      </div>
      <button
        aria-label={`${storeName} 찜하기`}
        className={`${actionButtonClassName} ${
          direction === 'wish'
            ? 'font-bold text-like'
            : 'font-medium text-text-secondary'
        }`}
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
