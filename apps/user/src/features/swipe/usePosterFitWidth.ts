import { useCallback, useState } from 'react';

// 카드 묶음 최대 폭 (큰 폰에서 폭을 채우되 너무 넓어지지 않게)
const MAX_WIDTH = 400;
// 카드 묶음에서 포스터를 뺀 높이: 포스터 아래 가격과 시간(69px) + 버튼 줄(64px) + 안내 문구(23px)
const NON_POSTER_HEIGHT = 156;
// 포스터는 점주 화면과 같은 3:4 (폭 = 높이 × 3/4)
const POSTER_WIDTH_PER_HEIGHT = 3 / 4;

const getFitWidth = (areaHeight: number) =>
  Math.min(
    MAX_WIDTH,
    Math.max(0, (areaHeight - NON_POSTER_HEIGHT) * POSTER_WIDTH_PER_HEIGHT),
  );

// 카드 묶음이 실제로 차지하는 높이. 폭은 영역 폭과 최대 폭 중 작은 쪽이다
const getUsedHeight = (areaWidth: number, fitWidth: number) =>
  Math.min(areaWidth, fitWidth) / POSTER_WIDTH_PER_HEIGHT + NON_POSTER_HEIGHT;

// 안쪽 여백을 뺀 크기 (ResizeObserver의 contentRect와 같은 기준)
const getContentSize = (element: HTMLElement) => {
  const style = getComputedStyle(element);
  return {
    width:
      element.clientWidth -
      parseFloat(style.paddingLeft) -
      parseFloat(style.paddingRight),
    height:
      element.clientHeight -
      parseFloat(style.paddingTop) -
      parseFloat(style.paddingBottom),
  };
};

// PC처럼 화면이 낮으면 포스터가 3:4를 지키도록 카드 묶음 폭을 줄인다
// 첫 값을 카드 묶음이 들어갈 영역의 ref에 걸면, 그 높이를 재서 묶음의 최대 폭(둘째 값)을 돌려준다
// 셋째 값은 카드 묶음을 다 그리고 남는 높이. 큰 화면에서 남는 자리에 무엇을 더 보여줄지 정할 때 쓴다
export const usePosterFitWidth = () => {
  const [maxWidth, setMaxWidth] = useState(MAX_WIDTH);
  const [spareHeight, setSpareHeight] = useState(0);

  const measureRef = useCallback((element: HTMLElement | null) => {
    if (!element) return;

    const measure = ({ height, width }: { height: number; width: number }) => {
      const fitWidth = getFitWidth(height);
      setMaxWidth(fitWidth);
      setSpareHeight(Math.max(0, height - getUsedHeight(width, fitWidth)));
    };

    // 요소가 화면에 붙자마자 그리기 전에 한 번 재서, 넓게 그렸다가 줄어드는 일이 없게 한다
    measure(getContentSize(element));

    const observer = new ResizeObserver(([entry]) => {
      if (entry) measure(entry.contentRect);
    });
    observer.observe(element);

    // 요소가 사라지면 관찰을 멈춘다
    return () => observer.disconnect();
  }, []);

  return [measureRef, maxWidth, spareHeight] as const;
};
