import { useEffect, useState } from 'react';

// 카드 묶음 최대 폭 (큰 폰에서 폭을 채우되 너무 넓어지지 않게)
const MAX_WIDTH = 400;
// 카드 묶음에서 포스터를 뺀 높이: 포스터 아래 가격과 시간(69px) + 버튼 줄(64px) + 안내 문구(23px)
const NON_POSTER_HEIGHT = 156;
// 포스터는 점주 화면과 같은 3:4 (폭 = 높이 × 3/4)
const POSTER_WIDTH_PER_HEIGHT = 3 / 4;

// PC처럼 화면이 낮으면 포스터가 3:4를 지키도록 카드 묶음 폭을 줄인다
// 첫 값을 카드 묶음이 들어갈 영역의 ref에 걸면, 그 높이를 재서 묶음의 최대 폭(둘째 값)을 돌려준다
export const usePosterFitWidth = () => {
  const [element, setElement] = useState<HTMLElement | null>(null);
  const [maxWidth, setMaxWidth] = useState(MAX_WIDTH);

  useEffect(() => {
    if (!element) return;

    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return;

      const posterHeight = entry.contentRect.height - NON_POSTER_HEIGHT;
      setMaxWidth(
        Math.min(
          MAX_WIDTH,
          Math.max(0, posterHeight * POSTER_WIDTH_PER_HEIGHT),
        ),
      );
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, [element]);

  return [setElement, maxWidth] as const;
};
