import { type PointerEvent, useRef, useState } from 'react';

import type { SwipeAction } from '@user/api/feed';

// 카드 폭의 이 비율 이상 밀고 놓으면 찜 또는 패스로 본다
const SWIPE_THRESHOLD_RATIO = 0.3;
// 끄는 방향을 안내에 표시하기 시작하는 거리
const DIRECTION_HINT_PX = 20;
// 1px 밀 때마다 기울어지는 각도
const ROTATE_DEG_PER_PX = 0.06;

const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

interface UseSwipeGestureOptions {
  onSwipe: (action: SwipeAction) => void;
}

export const useSwipeGesture = ({ onSwipe }: UseSwipeGestureOptions) => {
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [leavingAction, setLeavingAction] = useState<SwipeAction | null>(null);
  const startX = useRef<number | null>(null);
  const cardWidth = useRef(0);

  const finish = (action: SwipeAction) => {
    setDragX(0);
    setLeavingAction(null);
    onSwipe(action);
  };

  // 카드를 화면 밖으로 날려 보낸 뒤 찜 또는 패스를 처리한다
  const swipe = (action: SwipeAction) => {
    if (leavingAction) return;

    if (prefersReducedMotion()) {
      finish(action);
      return;
    }

    setIsDragging(false);
    setLeavingAction(action);
    setDragX((action === 'wish' ? 1 : -1) * window.innerWidth);
  };

  const handlePointerDown = (event: PointerEvent<HTMLElement>) => {
    if (
      leavingAction ||
      (event.pointerType === 'mouse' && event.button !== 0)
    ) {
      return;
    }

    startX.current = event.clientX;
    cardWidth.current = event.currentTarget.offsetWidth;
    event.currentTarget.setPointerCapture(event.pointerId);
    setIsDragging(true);
  };

  const handlePointerMove = (event: PointerEvent<HTMLElement>) => {
    if (startX.current === null) return;

    setDragX(event.clientX - startX.current);
  };

  const handlePointerEnd = () => {
    if (startX.current === null) return;

    startX.current = null;
    setIsDragging(false);

    if (Math.abs(dragX) >= cardWidth.current * SWIPE_THRESHOLD_RATIO) {
      swipe(dragX > 0 ? 'wish' : 'pass');
    } else {
      setDragX(0);
    }
  };

  const handleTransitionEnd = () => {
    if (leavingAction) {
      finish(leavingAction);
    }
  };

  let direction: SwipeAction | null = leavingAction;
  if (!direction && dragX > DIRECTION_HINT_PX) direction = 'wish';
  if (!direction && dragX < -DIRECTION_HINT_PX) direction = 'pass';

  return {
    direction,
    swipe,
    cardProps: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerEnd,
      onPointerCancel: handlePointerEnd,
      onTransitionEnd: handleTransitionEnd,
      style: {
        transform: `translateX(${dragX}px) rotate(${dragX * ROTATE_DEG_PER_PX}deg)`,
        // 끄는 동안은 손가락을 바로 따라가고, 놓은 뒤에만 부드럽게 움직인다
        transition: isDragging ? 'none' : 'transform 0.25s ease-out',
      },
    },
  };
};
