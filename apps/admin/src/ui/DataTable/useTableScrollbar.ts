import {
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

interface ScrollMetrics {
  height: number;
  contentHeight: number;
  top: number;
  headerHeight: number;
}

const trackPadding = 4;
const minimumThumbHeight = 24;
const keyboardScrollStep = 40;

/** 테이블 본문 위 스크롤바의 위치와 드래그·키보드 조작을 관리한다. */
export const useTableScrollbar = (
  children: ReactNode,
  maxHeight: CSSProperties['maxHeight'],
) => {
  const viewportRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ pointerId: number; y: number; top: number } | null>(
    null,
  );
  const [metrics, setMetrics] = useState<ScrollMetrics>({
    height: 0,
    contentHeight: 0,
    top: 0,
    headerHeight: 0,
  });

  const updateMetrics = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const header = viewport.querySelector('thead');
    const next = {
      height: viewport.clientHeight,
      contentHeight: viewport.scrollHeight,
      top: viewport.scrollTop,
      headerHeight: viewport.querySelector('tbody [data-table-cell]')
        ? (header?.getBoundingClientRect().height ?? 0)
        : 0,
    };
    setMetrics((current) =>
      current.height === next.height &&
      current.contentHeight === next.contentHeight &&
      current.top === next.top &&
      current.headerHeight === next.headerHeight
        ? current
        : next,
    );
  }, []);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const observer = new ResizeObserver(updateMetrics);
    observer.observe(viewport);
    if (viewport.firstElementChild)
      observer.observe(viewport.firstElementChild);
    const header = viewport.querySelector('thead');
    if (header) observer.observe(header);
    return () => observer.disconnect();
  }, [children, maxHeight, updateMetrics]);

  // 헤더를 제외한 본문 안에만 스크롤바를 겹쳐 표시해 열 제목과 행 배경의 폭을 유지한다.
  const trackHeight = Math.max(
    0,
    metrics.height - metrics.headerHeight - trackPadding * 2,
  );
  const scrollRange = Math.max(0, metrics.contentHeight - metrics.height);
  const thumbHeight = Math.min(
    trackHeight,
    Math.max(
      minimumThumbHeight,
      (trackHeight * Math.max(0, metrics.height - metrics.headerHeight)) /
        Math.max(1, metrics.contentHeight - metrics.headerHeight),
    ),
  );
  const thumbRange = trackHeight - thumbHeight;
  const thumbTop = scrollRange
    ? Math.max(0, Math.min(1, metrics.top / scrollRange)) * thumbRange
    : 0;

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    const viewport = viewportRef.current;
    if (!viewport || event.button !== 0 || thumbRange <= 0) return;
    event.preventDefault();
    if (event.target === event.currentTarget) {
      const position =
        event.clientY -
        event.currentTarget.getBoundingClientRect().top -
        thumbHeight / 2;
      viewport.scrollTop =
        Math.max(0, Math.min(1, position / thumbRange)) * scrollRange;
    }
    dragRef.current = {
      pointerId: event.pointerId,
      y: event.clientY,
      top: viewport.scrollTop,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (
      !drag ||
      drag.pointerId !== event.pointerId ||
      !viewportRef.current ||
      thumbRange <= 0
    )
      return;
    viewportRef.current.scrollTop =
      drag.top + ((event.clientY - drag.y) * scrollRange) / thumbRange;
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const targets: Record<string, number> = {
      ArrowDown: viewport.scrollTop + keyboardScrollStep,
      ArrowUp: viewport.scrollTop - keyboardScrollStep,
      PageDown: viewport.scrollTop + trackHeight,
      PageUp: viewport.scrollTop - trackHeight,
      Home: 0,
      End: scrollRange,
    };
    if (event.key in targets) {
      event.preventDefault();
      event.stopPropagation();
      viewport.scrollTop = targets[event.key];
    }
  };

  const finishDrag = () => {
    dragRef.current = null;
  };
  return {
    viewportRef,
    trackTop: metrics.headerHeight + trackPadding,
    scrollRange,
    scrollTop: Math.max(0, Math.min(scrollRange, metrics.top)),
    trackHeight,
    thumbHeight,
    thumbTop,
    updateMetrics,
    handlePointerDown,
    handlePointerMove,
    handleKeyDown,
    finishDrag,
  };
};
