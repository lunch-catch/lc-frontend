import { type UIEvent, useState } from 'react';
import { Store } from 'lucide-react';

interface StoreHeroImagesProps {
  // 가게 대표 이미지. 서버 필드 이름은 logoImage지만, 점주에게는 "손님이 가게를 찾을 때 보여지는 사진"으로 받는다
  mainImageUrl: string | null;
  interiorImageUrls: string[];
}

// 가게 상세 맨 위 사진. 대표 이미지를 첫 장으로, 이어서 내부 사진을 옆으로 넘겨 본다
// 사진이 하나도 없으면 회색 바탕에 가게 아이콘을 둔다
const StoreHeroImages = ({
  interiorImageUrls,
  mainImageUrl,
}: StoreHeroImagesProps) => {
  // 지금 보고 있는 사진 순서(0부터)
  const [index, setIndex] = useState(0);
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

  return (
    <>
      <div
        aria-label="가게 사진"
        className="flex size-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain scrollbar-none [&::-webkit-scrollbar]:hidden"
        onScroll={handleScroll}
        role="region"
      >
        {imageUrls.map((url, position) => (
          <img
            alt={`가게 사진 ${position + 1}/${imageUrls.length}`}
            className="size-full shrink-0 snap-center object-cover"
            height={240}
            key={url}
            // 첫 장만 바로 받고 나머지는 넘길 때 받는다
            loading={position === 0 ? 'eager' : 'lazy'}
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
