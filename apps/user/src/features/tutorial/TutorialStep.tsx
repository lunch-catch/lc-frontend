import { type PointerEvent, useRef, useState } from 'react';
import { useNavigate } from 'react-router';

import tutorialBrowse from '@user/assets/illustrations/tutorial-browse.webp';
import tutorialCoupon from '@user/assets/illustrations/tutorial-coupon.webp';
import tutorialLike from '@user/assets/illustrations/tutorial-like.webp';
import { useAuth } from '@user/auth/useAuth';
import ActionButton from '@user/components/ActionButton/ActionButton';

// 서비스의 흐름(넘기기 → 찜 → 11시에 받기)을 한 장씩 보여준다 (Figma 2. 튜토리얼)
const pages = [
  {
    image: tutorialBrowse,
    title: ['왼쪽은 패스,', '오른쪽은 찜'],
    description: ['주변 가게의 캠페인을 보고', '관심 없는 카드는 패스해요.'],
  },
  {
    image: tutorialLike,
    title: ['마음에 드는', '캠페인은 찜하기'],
    description: ['찜은 11시 선착순 발급에', '참여하기 위한 단계예요.'],
  },
  {
    image: tutorialCoupon,
    title: ['11시에', '쿠폰 받기'],
    description: ['찜 목록에서 쿠폰을 받은 뒤', '매장에서 QR로 사용하세요.'],
  },
];

// 이만큼 넘게 가로로 밀어야 장을 넘긴다. 살짝 건드린 것은 무시한다
const SWIPE_THRESHOLD_PX = 50;

type SlideDirection = 'next' | 'previous';

// 다음 장은 오른쪽에서, 이전 장은 왼쪽에서 밀려 들어온다
const slideInClassNames: Record<SlideDirection, string> = {
  next: 'animate-slide-in motion-reduce:animate-none',
  previous: 'animate-slide-in-back motion-reduce:animate-none',
};

// 온보딩의 마지막 단계로 한 번 보여주는 서비스 안내
const TutorialStep = () => {
  const navigate = useNavigate();
  const [pageIndex, setPageIndex] = useState(0);
  const [direction, setDirection] = useState<SlideDirection>('next');
  // 밀기 시작한 손가락 위치
  const swipeStart = useRef<{ x: number; y: number } | null>(null);
  const page = pages[pageIndex] ?? pages[0];
  const isLastPage = pageIndex === pages.length - 1;

  const { completeOnboarding } = useAuth();

  // 안내를 끝내거나 건너뛰면 온보딩을 완료 처리한다
  // 튜토리얼은 다시 돌아올 화면이 아니라서 기록을 바꿔서 이동한다
  const finish = () => {
    completeOnboarding();
    navigate('/swipe', { replace: true });
  };

  const goToPage = (nextIndex: number) => {
    if (nextIndex < 0 || nextIndex >= pages.length) return;
    setDirection(nextIndex > pageIndex ? 'next' : 'previous');
    setPageIndex(nextIndex);
  };

  const handleNext = () => {
    if (isLastPage) {
      finish();
      return;
    }
    goToPage(pageIndex + 1);
  };

  const handlePointerDown = (event: PointerEvent) => {
    swipeStart.current = { x: event.clientX, y: event.clientY };
  };

  // 가로로 충분히 밀었으면 왼쪽은 다음 장, 오른쪽은 이전 장으로 간다
  // 마지막 장에서 왼쪽으로 밀어도 끝내지 않는다. 실수로 밀다가 안내가 끝나지 않도록 끝내기는 버튼으로만 한다
  const handlePointerUp = (event: PointerEvent) => {
    const start = swipeStart.current;
    swipeStart.current = null;
    if (!start) return;

    const deltaX = event.clientX - start.x;
    const deltaY = event.clientY - start.y;
    if (
      Math.abs(deltaX) < SWIPE_THRESHOLD_PX ||
      Math.abs(deltaX) < Math.abs(deltaY)
    ) {
      return;
    }

    goToPage(deltaX < 0 ? pageIndex + 1 : pageIndex - 1);
  };

  return (
    <main className="mx-auto flex min-h-dvh max-w-mobile flex-col bg-bg-page px-page pt-3 pb-[max(16px,env(safe-area-inset-bottom))]">
      <div className="flex justify-end">
        <button
          className="rounded-md px-1 py-2 text-body-sm-mobile font-medium text-text-secondary"
          onClick={finish}
          type="button"
        >
          건너뛰기
        </button>
      </div>
      {/* 건너뛰기와 버튼 사이에 남는 높이의 세로 가운데에 그림과 안내를 둔다 */}
      {/* 이 영역을 손가락으로 밀어 장을 넘긴다. 세로 스크롤은 브라우저에 맡기고 가로 움직임만 받는다 */}
      <div
        className="flex flex-1 touch-pan-y flex-col justify-center py-6 select-none"
        onPointerCancel={() => {
          swipeStart.current = null;
        }}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
      >
        {/* 세 장의 그림을 겹쳐 두고 지금 장만 보여, 넘길 때 그림을 새로 불러오며 깜빡이지 않게 한다 */}
        {/* 지금 장이 된 그림에 움직임 클래스가 붙는 순간 넘긴 방향에서 밀려 들어온다 */}
        <div className="relative aspect-700/540 w-full">
          {pages.map((item, index) => (
            <img
              alt=""
              className={`absolute inset-0 size-full object-contain ${
                index === pageIndex ? slideInClassNames[direction] : 'opacity-0'
              }`}
              // PC에서 마우스로 밀 때 그림이 끌려 나오지 않게 한다
              draggable={false}
              height={540}
              key={item.image}
              src={item.image}
              width={700}
            />
          ))}
        </div>
        {/* 지금 장의 점이 가로로 길어져 몇 번째 장인지 잘 보이게 한다 */}
        <div aria-hidden="true" className="mt-6 flex justify-center gap-3">
          {pages.map((item, index) => (
            <span
              className={`h-1.75 rounded-full transition-all duration-300 motion-reduce:transition-none ${
                index === pageIndex
                  ? 'w-5 bg-action-primary'
                  : 'w-1.75 bg-border-subtle'
              }`}
              key={item.image}
            />
          ))}
        </div>
        {/* 화면 읽기 프로그램이 장이 바뀔 때 새 안내를 읽도록 알린다 */}
        <div aria-live="polite" className="mt-10 text-center">
          <p className="sr-only">
            {pages.length}장 중 {pageIndex + 1}번째
          </p>
          {/* 장이 바뀔 때마다 새로 그려 그림과 같은 움직임으로 들어온다 */}
          <div className={slideInClassNames[direction]} key={pageIndex}>
            <h1 className="text-display-mobile leading-snug font-black text-text-primary">
              {page.title[0]}
              <br />
              {page.title[1]}
            </h1>
            <p className="mt-2 text-body-sm-mobile leading-snug text-text-secondary">
              {page.description[0]}
              <br />
              {page.description[1]}
            </p>
          </div>
        </div>
      </div>
      <ActionButton onClick={handleNext} size="large">
        {isLastPage ? '런치캐치 시작하기' : '다음'}
      </ActionButton>
    </main>
  );
};

export default TutorialStep;
