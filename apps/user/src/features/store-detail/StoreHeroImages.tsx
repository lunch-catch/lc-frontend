import { type PointerEvent, type UIEvent, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Store } from 'lucide-react';

import FadeImage from '@user/ui/FadeImage/FadeImage';

interface StoreHeroImagesProps {
  // 가게 대표 이미지. 서버 필드 이름은 logoImage지만, 점주에게는 "손님이 가게를 찾을 때 보여지는 사진"으로 받는다
  mainImageUrl: string | null;
  interiorImageUrls: string[];
}

// 이만큼(px) 끌면 누른 것이 아니라 끈 것으로 본다
const DRAG_START_PX = 5;

// 가게 상세 맨 위 사진. 대표 이미지를 첫 장으로, 이어서 내부 사진을 옆으로 넘겨 본다
// 사진이 하나도 없으면 회색 바탕에 가게 아이콘을 둔다
const StoreHeroImages = ({
  interiorImageUrls,
  mainImageUrl,
}: StoreHeroImagesProps) => {
  // 지금 보고 있는 사진 순서(0부터)
  const [index, setIndex] = useState(0);
  const regionRef = useRef<HTMLDivElement>(null);
  // 마우스로 끌어 넘기는 중의 시작 위치. 손가락은 브라우저가 알아서 밀어 주므로 마우스만 다룬다
  const drag = useRef<{ startX: number; startLeft: number } | null>(null);
  const didDrag = useRef(false);
  // 불러오지 못한 사진 주소. 깨진 사진 대신 빼고 보여주고, 모두 실패하면 가게 아이콘을 둔다
  const [failedUrls, setFailedUrls] = useState<string[]>([]);
  const imageUrls = [
    ...(mainImageUrl ? [mainImageUrl] : []),
    ...interiorImageUrls,
  ].filter((url) => !failedUrls.includes(url));
  // 보던 사진이 빠져 장 수가 줄어도 번호가 장 수를 넘지 않게 한다
  const currentIndex = Math.min(index, Math.max(0, imageUrls.length - 1));

  if (imageUrls.length === 0) {
    return (
      <div
        aria-hidden="true"
        className="flex size-full items-center justify-center text-text-tertiary"
      >
        <Store className="size-12" />
      </div>
    );
  }

  // 한 장씩 딱 맞게 멈추도록 스크롤 스냅을 쓰고, 멈춘 자리로 몇 번째 사진인지 계산한다
  const handleScroll = (event: UIEvent<HTMLDivElement>) => {
    const { clientWidth, scrollLeft } = event.currentTarget;
    if (clientWidth > 0) setIndex(Math.round(scrollLeft / clientWidth));
  };

  // 마우스로 끌 수 있다는 단서가 없어서, 마우스가 있는 화면에는 사진 위에 올렸을 때 이전·다음 버튼을 보여준다
  // 평소에는 숨겨 사진을 가리지 않고, 키보드로 닿으면 바로 보인다
  const moveTo = (nextIndex: number) => {
    const region = regionRef.current;
    if (!region) return;
    region.scrollTo({
      left: nextIndex * region.clientWidth,
      behavior: 'smooth',
    });
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'mouse' || event.button !== 0) return;
    didDrag.current = false;
    drag.current = {
      startX: event.clientX,
      startLeft: event.currentTarget.scrollLeft,
    };
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const start = drag.current;
    if (!start) return;
    // 5px 움직이기 전에 영역 밖에서 버튼을 놓으면 pointerup을 못 받아 끌기 상태가 남는다
    // 그대로 두면 버튼을 누르지 않고 돌아와도 움직이므로, 왼쪽 버튼이 눌려 있지 않으면 정리한다
    if ((event.buttons & 1) === 0) {
      drag.current = null;
      return;
    }

    const distance = event.clientX - start.startX;
    if (!didDrag.current) {
      if (Math.abs(distance) < DRAG_START_PX) return;
      didDrag.current = true;
      // 끄는 동안에는 칸에 달라붙지 않게 하고, 마우스가 사진 밖으로 나가도 따라오게 잡는다
      event.currentTarget.style.scrollSnapType = 'none';
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    event.currentTarget.scrollLeft = start.startLeft - distance;
  };

  // 놓은 자리에서 가장 가까운 사진으로 맞춘다
  const finishDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;
    drag.current = null;
    if (!didDrag.current) return;

    const region = event.currentTarget;
    region.style.scrollSnapType = '';
    moveTo(Math.round(region.scrollLeft / region.clientWidth));
  };

  return (
    <>
      <div
        aria-label="가게 사진"
        className="peer flex size-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain scrollbar-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-action-primary [&::-webkit-scrollbar]:hidden"
        onPointerCancel={finishDrag}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishDrag}
        onScroll={handleScroll}
        ref={regionRef}
        role="region"
        // 사진이 여러 장이면 키보드로도 사진 칸에 닿아 방향키로 넘길 수 있게 한다
        // 이전·다음 버튼은 마우스가 있는 화면에만 있어서, 터치 기기에 키보드를 붙이면 넘길 방법이 없었다
        tabIndex={imageUrls.length > 1 ? 0 : undefined}
      >
        {imageUrls.map((url, position) => (
          <FadeImage
            alt={`가게 사진 ${position + 1}/${imageUrls.length}`}
            className="size-full shrink-0 snap-center"
            height={240}
            key={url}
            // 첫 장만 바로 받고 나머지는 넘길 때 받는다
            loading={position === 0 ? 'eager' : 'lazy'}
            draggable={false}
            onError={() =>
              setFailedUrls((current) =>
                current.includes(url) ? current : [...current, url],
              )
            }
            src={url}
            width={390}
          />
        ))}
      </div>
      {imageUrls.length > 1 && (
        <>
          {currentIndex > 0 && (
            <button
              aria-label="이전 사진"
              className="absolute top-1/2 left-3 z-10 hidden size-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition-opacity peer-hover:opacity-100 hover:opacity-100 focus-visible:opacity-100 motion-reduce:transition-none [@media(hover:hover)]:flex"
              onClick={() => moveTo(currentIndex - 1)}
              type="button"
            >
              <ChevronLeft aria-hidden="true" className="size-5" />
            </button>
          )}
          {currentIndex < imageUrls.length - 1 && (
            <button
              aria-label="다음 사진"
              className="absolute top-1/2 right-3 z-10 hidden size-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition-opacity peer-hover:opacity-100 hover:opacity-100 focus-visible:opacity-100 motion-reduce:transition-none [@media(hover:hover)]:flex"
              onClick={() => moveTo(currentIndex + 1)}
              type="button"
            >
              <ChevronRight aria-hidden="true" className="size-5" />
            </button>
          )}
        </>
      )}
      {imageUrls.length > 1 && (
        <span
          aria-hidden="true"
          className="absolute right-3 bottom-3 rounded-full bg-black/50 px-2 py-0.5 text-caption-mobile font-medium text-white tabular-nums"
        >
          {currentIndex + 1}/{imageUrls.length}
        </span>
      )}
    </>
  );
};

export default StoreHeroImages;
