import { Heart, X } from 'lucide-react';

import type { SwipeAction } from '@user/api/feed';

interface GestureRailProps {
  // 버튼 이름에 붙일 가게 이름. 로딩 중에는 없을 수 있다
  storeName?: string;
  // 피드를 불러오는 중처럼 아직 고를 카드가 없을 때
  disabled?: boolean;
  // 카드를 끌고 있는 방향. 끌지 않으면 null
  direction: SwipeAction | null;
  onPass: () => void;
  onWish: () => void;
}

// 작은 화면에서 카드 폭이 좁아져도 "패스"가 두 줄로 꺾이지 않게 글자를 한 줄로 두고, 줄어들 몫은 가운데 안내가 진다
const actionButtonClassName =
  'flex h-12 w-22 shrink-0 items-center justify-center gap-1.5 rounded-lg text-caption-mobile whitespace-nowrap transition-colors active:bg-surface-subtle focus-visible:outline-2 focus-visible:outline-action-primary disabled:cursor-not-allowed';

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
  disabled = false,
  onPass,
  onWish,
  storeName,
}: GestureRailProps) => {
  const hint = hintByDirection[direction ?? 'none'];

  return (
    <div
      // 카드와 버튼 사이가 위쪽(필터 줄과 카드 사이)과 비슷하도록 버튼 높이(48px, 터치 영역 44px 이상)만큼만 둔다
      className={`flex h-12 items-center justify-between ${disabled ? 'opacity-40' : ''}`}
    >
      <button
        aria-label={storeName ? `${storeName} 패스` : '패스'}
        disabled={disabled}
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
      <div
        aria-hidden="true"
        className="flex min-w-0 flex-1 flex-col items-center gap-2"
      >
        <span
          className={`max-w-full truncate text-caption-mobile ${hint.textClassName}`}
        >
          {hint.label}
        </span>
        <span
          className={`relative h-0.5 w-full max-w-34 rounded-full ${hint.trackClassName}`}
        >
          <span
            className={`absolute -top-0.5 size-1.5 rounded-full ${hint.dotClassName}`}
          />
        </span>
      </div>
      <button
        aria-label={storeName ? `${storeName} 찜하기` : '찜하기'}
        disabled={disabled}
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
