import {
  type MouseEvent,
  type PointerEvent,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';

import type { StoreListItem } from '@user/api/store';

import FeaturedStoreCard from './FeaturedStoreCard';

// 슬라이드에 보여줄 가게 수
const SLIDE_COUNT = 3;
// 자동으로 다음 카드로 넘기는 간격(ms). 너무 빠르면 할인 문구를 읽다 놓친다
const AUTOPLAY_MS = 4000;
// 사용자가 손댄 뒤 자동 넘김을 쉬는 시간(ms)
const REST_AFTER_TOUCH_MS = 8000;
// 자동으로 넘기는 최대 횟수. 3장을 두 바퀴 돌고 멈춰, 끝없이 움직이는 화면이 되지 않게 한다
const MAX_AUTO_ADVANCES = 6;
// 이만큼 이상 끌어야 옆 카드로 넘긴다 / 이만큼 이상 움직였으면 끈 것으로 보고 눌림은 무시한다
const SWIPE_THRESHOLD_PX = 40;
const DRAG_START_PX = 6;
const CARD_GAP_PX = 12;
// 가운데 카드의 폭(전체 폭 대비). 양옆에 이전, 다음 카드가 조금씩 보이는 폭이다
const CARD_WIDTH_PERCENT = 76;

const reducedMotionQuery = '(prefers-reduced-motion: reduce)';

// 움직임 줄이기를 켠 사용자에게는 자동으로 넘기지 않는다
const usePrefersReducedMotion = () =>
  useSyncExternalStore(
    (onChange) => {
      const query = window.matchMedia(reducedMotionQuery);
      query.addEventListener('change', onChange);
      return () => query.removeEventListener('change', onChange);
    },
    () => window.matchMedia(reducedMotionQuery).matches,
    () => false,
  );

interface NearbyCouponSliderProps {
  // 쿠폰 진행 중인 가게. 서버가 준 거리순 그대로 받는다
  stores: StoreListItem[];
}

interface CarouselState {
  index: number;
  // 마지막으로 넘긴 방향. 3장이 이어지는 슬라이드에서 반대편으로 건너가는 카드를 찾는 데 쓴다
  direction: -1 | 0 | 1;
}

// 가운데 카드 양옆에 이전, 다음 카드가 보이는 슬라이드. 3장이 끝없이 이어지고 2장이면 끝에서 멈춘다
// 4초마다 저절로 넘어가되, 만지면 쉬고, 화면에서 벗어나거나 앱이 뒤에 있으면 멈춘다
const Carousel = ({ stores }: NearbyCouponSliderProps) => {
  const count = stores.length;
  const isLoop = count >= 3;
  const [state, setState] = useState<CarouselState>({
    index: 0,
    direction: 0,
  });
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isResting, setIsResting] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isInView, setIsInView] = useState(true);
  const [isTabVisible, setIsTabVisible] = useState(
    () => document.visibilityState === 'visible',
  );
  const [autoAdvances, setAutoAdvances] = useState(0);
  const reducedMotion = usePrefersReducedMotion();

  const listRef = useRef<HTMLUListElement>(null);
  const dragStartX = useRef<number | null>(null);
  // 방금 끌었는지. 끈 직후에 따라오는 눌림은 카드를 여는 것으로 보지 않는다
  const didDrag = useRef(false);
  const restTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const move = (delta: number) =>
    setState((previous) => {
      const next = isLoop
        ? (previous.index + delta + count) % count
        : Math.min(Math.max(previous.index + delta, 0), count - 1);
      return next === previous.index
        ? previous
        : { index: next, direction: delta > 0 ? 1 : -1 };
    });

  // 사용자가 손댄 뒤에는 한동안 자동 넘김을 쉰다
  const rest = () => {
    setIsResting(true);
    clearTimeout(restTimer.current);
    restTimer.current = setTimeout(
      () => setIsResting(false),
      REST_AFTER_TOUCH_MS,
    );
  };

  const goTo = (target: number) => {
    // 가장 짧은 쪽으로 간다. 3장이면 바로 옆 카드는 한 칸이다
    const raw = target - state.index;
    const delta =
      isLoop && Math.abs(raw) > count / 2 ? raw - Math.sign(raw) * count : raw;
    move(delta);
    rest();
  };

  useEffect(() => () => clearTimeout(restTimer.current), []);

  // 슬라이드가 화면에서 가려지면 넘기지 않는다
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsInView(entry?.isIntersecting ?? true),
      { threshold: 0.5 },
    );
    observer.observe(list);
    return () => observer.disconnect();
  }, []);

  // 앱이 뒤로 가 있는 동안에는 넘기지 않는다
  useEffect(() => {
    const handle = () =>
      setIsTabVisible(document.visibilityState === 'visible');
    document.addEventListener('visibilitychange', handle);
    return () => document.removeEventListener('visibilitychange', handle);
  }, []);

  const canAutoplay =
    !reducedMotion &&
    isInView &&
    isTabVisible &&
    !isResting &&
    !isHovered &&
    !isDragging &&
    autoAdvances < MAX_AUTO_ADVANCES;

  useEffect(() => {
    if (!canAutoplay) return;
    const timer = setTimeout(() => {
      // 2장일 때는 끝에서 처음으로 되감는다
      const isLast = !isLoop && state.index === count - 1;
      move(isLast ? -1 : 1);
      setAutoAdvances((value) => value + 1);
    }, AUTOPLAY_MS);
    return () => clearTimeout(timer);
    // move는 매번 새로 만들어지지만 count와 isLoop만 쓴다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canAutoplay, state.index, count, isLoop]);

  const finishDrag = (clientX: number | null) => {
    const start = dragStartX.current;
    dragStartX.current = null;
    if (start === null) return;

    const distance = clientX === null ? 0 : clientX - start;
    if (didDrag.current) {
      if (distance <= -SWIPE_THRESHOLD_PX) move(1);
      else if (distance >= SWIPE_THRESHOLD_PX) move(-1);
      rest();
    }
    setIsDragging(false);
    setDragX(0);
  };

  const handlePointerDown = (event: PointerEvent<HTMLUListElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    dragStartX.current = event.clientX;
    didDrag.current = false;
  };

  const handlePointerMove = (event: PointerEvent<HTMLUListElement>) => {
    if (dragStartX.current === null) return;
    const distance = event.clientX - dragStartX.current;
    if (!didDrag.current && Math.abs(distance) < DRAG_START_PX) return;

    if (!didDrag.current) {
      didDrag.current = true;
      setIsDragging(true);
      // 끌기 시작하면 손가락이 카드 밖으로 나가도 계속 받는다
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    setDragX(distance);
  };

  // 끈 직후의 눌림은 카드를 여는 것이 아니다
  const handleClickCapture = (event: MouseEvent<HTMLUListElement>) => {
    if (didDrag.current) {
      event.preventDefault();
      event.stopPropagation();
      didDrag.current = false;
    }
  };

  const getOffset = (index: number) => {
    if (!isLoop) return index - state.index;
    const raw = (index - state.index + count) % count;
    return raw > count / 2 ? raw - count : raw;
  };

  return (
    <div className="flex flex-col gap-2">
      <ul
        aria-label="가까운 쿠폰 가게"
        aria-roledescription="carousel"
        // 위아래로는 화면이 스크롤되고, 좌우로만 슬라이드가 움직인다
        // 높이는 가운데 카드(16:9)와 같은 폭의 빈 항목이 잡아 준다. 카드는 모두 겹쳐 놓아 높이를 정하지 못한다
        className="relative -mx-page touch-pan-y overflow-hidden px-0 py-1 select-none"
        onClickCapture={handleClickCapture}
        // 마우스로 끌 때 브라우저가 링크(카드)를 끌어가는 동작을 시작해 슬라이드가 멈추지 않게 한다
        onDragStart={(event) => event.preventDefault()}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onPointerCancel={() => finishDrag(null)}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={(event) => finishDrag(event.clientX)}
        ref={listRef}
      >
        <li
          aria-hidden="true"
          className="invisible mx-auto aspect-video"
          style={{ width: `${CARD_WIDTH_PERCENT}%` }}
        />
        {stores.map((store, index) => {
          const offset = getOffset(index);
          const isCenter = offset === 0;
          // 반대편으로 건너가는 카드는 화면을 가로질러 움직이지 않고 바로 자리를 옮긴다
          const isWrapping = isLoop && state.direction === offset;
          const isHidden = Math.abs(offset) > 1;

          return (
            <FeaturedStoreCard
              itemProps={{
                'aria-hidden': isHidden || undefined,
                'aria-label': `${index + 1} / ${count}`,
                'aria-roledescription': 'slide',
                className: `absolute top-1 left-1/2 ${
                  isWrapping || isDragging
                    ? ''
                    : 'transition-[transform,opacity] duration-300 ease-out motion-reduce:transition-none'
                }`,
                // 옆 카드를 누르면 열지 않고 가운데로 가져온다
                onClickCapture: (event) => {
                  if (isCenter) return;
                  event.preventDefault();
                  event.stopPropagation();
                  goTo(index);
                },
                // 키보드로 옆 카드에 닿으면 가운데로 가져온다
                // 마우스나 손가락으로 누를 때도 포커스가 먼저 생기는데, 그때 옮기면 누른 카드가 가운데로 와서 열려 버린다
                onFocus: (event) => {
                  if (!isCenter && event.target.matches(':focus-visible')) {
                    goTo(index);
                  }
                },
                style: {
                  // 옆 카드는 조금 작고 흐리게 해서 가운데 카드가 돋보이게 한다
                  opacity: isCenter ? 1 : 0.7,
                  transform: `translateX(calc(-50% + ${offset} * (100% + ${CARD_GAP_PX}px) + ${dragX}px)) scale(${isCenter ? 1 : 0.92})`,
                  width: `${CARD_WIDTH_PERCENT}%`,
                },
              }}
              key={store.storeId}
              rank={index + 1}
              store={store}
              variant="slide"
            />
          );
        })}
      </ul>
      {/* 지금 몇 번째인지 점으로 보여준다. 눌러서 그 카드로 갈 수 있다 */}
      <div className="flex items-center justify-center">
        {stores.map((store, index) => (
          <button
            aria-current={index === state.index || undefined}
            aria-label={`${index + 1}번째 가게 보기`}
            className="flex h-6 items-center px-1 focus-visible:outline-2 focus-visible:outline-action-primary"
            key={store.storeId}
            onClick={() => goTo(index)}
            type="button"
          >
            <span
              className={`block h-1.5 rounded-full transition-all duration-300 motion-reduce:transition-none ${
                index === state.index
                  ? 'w-5 bg-action-primary'
                  : 'w-1.5 bg-text-tertiary/35'
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );
};

// 탐색 목록 맨 위의 "가까운 순 쿠폰" 슬라이드. 쿠폰 진행 중인 가게 중 가장 가까운 최대 3곳을 보여준다
// 쿠폰이 없는 가게로 자리를 채우지 않는다. 한 곳뿐이면 슬라이드 없이 큰 카드 한 장으로 둔다
// 아래 목록에도 같은 가게가 있다. 슬라이드는 가까운 곳으로 가는 지름길이고, 목록이 전체이기 때문이다
const NearbyCouponSlider = ({ stores }: NearbyCouponSliderProps) => {
  const nearest = stores.slice(0, SLIDE_COUNT);

  if (nearest.length === 0) return null;

  const [only] = nearest;
  if (nearest.length === 1 && only) {
    return (
      <ul>
        <FeaturedStoreCard store={only} />
      </ul>
    );
  }

  return (
    <section
      aria-labelledby="nearby-coupons-title"
      className="flex flex-col gap-3"
    >
      <h3
        className="text-body-sm-mobile font-bold text-text-primary"
        id="nearby-coupons-title"
      >
        가까운 순 쿠폰 {nearest.length}곳
      </h3>
      <Carousel stores={nearest} />
    </section>
  );
};

export default NearbyCouponSlider;
