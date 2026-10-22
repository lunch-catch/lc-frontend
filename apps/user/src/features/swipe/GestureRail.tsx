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

// 두 버튼을 같은 폭으로 나눈다. 높이 48px로 터치 영역 44px 이상을 지킨다
const actionButtonClassName =
  'flex h-12 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-lg text-body-sm-mobile font-bold whitespace-nowrap transition-[background-color,opacity] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary disabled:cursor-not-allowed';

// 카드를 끄는 쪽 버튼은 손가락으로 누를 때와 같은 모습으로, 반대쪽 버튼은 흐리게 해서 어느 쪽을 고르는 중인지 보여준다
// 테두리나 고리를 덧대면 버튼마다 표시가 달라 어색해서, 누를 때와 끌 때를 같은 모습으로 맞춘다
const passStateClassName = {
  pass: 'bg-surface-subtle',
  wish: 'bg-bg-surface opacity-40',
  none: 'bg-bg-surface',
};
const wishStateClassName = {
  wish: 'bg-action-primary-hover',
  pass: 'bg-action-primary opacity-40',
  none: 'bg-action-primary',
};

// 카드를 끄는 쪽을 위 안내 글자로 알려준다
const hintByDirection = {
  wish: {
    label: '오른쪽으로 밀면 찜해요 →',
    className: 'font-bold text-text-brand',
  },
  pass: {
    label: '← 왼쪽으로 밀면 패스해요',
    className: 'font-bold text-text-primary',
  },
  none: { label: '← 좌우로 밀어 보세요 →', className: 'text-text-tertiary' },
};

// 포스터 아래 패스 / 찜하기 버튼과 좌우로 밀 수 있다는 안내
// 글자 줄만 있으면 누를 수 있는 버튼으로 잘 안 보여서, 두 버튼을 크게 나란히 두고 이 화면의 주된 행동인 찜하기를 주황으로 채운다
// 밀어서 고를 수도 있다는 건 버튼 위에 작은 글자로 남긴다
const GestureRail = ({
  direction,
  disabled = false,
  onPass,
  onWish,
  storeName,
}: GestureRailProps) => {
  const hint = hintByDirection[direction ?? 'none'];

  return (
    <div className={`flex flex-col gap-1.5 ${disabled ? 'opacity-40' : ''}`}>
      <p
        aria-hidden="true"
        className={`truncate text-center text-caption-mobile ${hint.className}`}
      >
        {hint.label}
      </p>
      <div className="flex gap-2">
        <button
          aria-label={storeName ? `${storeName} 패스` : '패스'}
          className={`${actionButtonClassName} border border-border-subtle text-text-primary active:bg-surface-subtle ${passStateClassName[direction ?? 'none']}`}
          disabled={disabled}
          onClick={onPass}
          type="button"
        >
          <X aria-hidden="true" className="size-4" />
          패스
        </button>
        <button
          aria-label={storeName ? `${storeName} 찜하기` : '찜하기'}
          className={`${actionButtonClassName} text-text-inverse active:bg-action-primary-hover ${wishStateClassName[direction ?? 'none']}`}
          disabled={disabled}
          onClick={onWish}
          type="button"
        >
          <Heart aria-hidden="true" className="size-4" />
          찜하기
        </button>
      </div>
    </div>
  );
};

export default GestureRail;
