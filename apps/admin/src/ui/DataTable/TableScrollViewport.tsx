import { type CSSProperties, type ReactNode, useId } from 'react';

import { ScrollArea } from '@admin/ui/ScrollArea/ScrollArea';

import { useTableScrollbar } from './useTableScrollbar';

interface TableScrollViewportProps {
  children: ReactNode;
  maxHeight: CSSProperties['maxHeight'];
}

export const TableScrollViewport = ({
  children,
  maxHeight,
}: TableScrollViewportProps) => {
  const viewportId = useId();
  const {
    viewportRef,
    viewportWidth,
    horizontalOverflow,
    trackTop,
    scrollRange,
    scrollTop,
    trackHeight,
    thumbHeight,
    thumbTop,
    updateMetrics,
    handlePointerDown,
    handlePointerMove,
    handleKeyDown,
    finishDrag,
  } = useTableScrollbar(children, maxHeight);
  // 가로 스크롤 컨테이너 안에서는 페이지 기준 sticky가 동작하지 않아 긴 표도 내부에서 스크롤한다.
  const internalScroll = maxHeight !== undefined || horizontalOverflow;
  const viewportMaxHeight =
    maxHeight ??
    (horizontalOverflow ? 'calc(100dvh - var(--space-12))' : undefined);

  return (
    <div className="relative min-w-0 max-w-full">
      <ScrollArea
        orientation="horizontal"
        hideScrollbar={internalScroll && !horizontalOverflow}
        ref={viewportRef}
        id={viewportId}
        tabIndex={internalScroll || horizontalOverflow ? 0 : undefined}
        aria-label="테이블 내용"
        role="region"
        className={[
          'min-w-0 w-full !flex-none [scrollbar-gutter:auto] focus-visible:outline-2 focus-visible:outline-action-primary',
          // 가로 넘침이 없는 화면에서는 overflow를 열어 페이지 기준 헤더 고정을 유지한다.
          internalScroll ? '!overflow-auto' : '!overflow-visible',
        ].join(' ')}
        style={
          {
            maxHeight: viewportMaxHeight,
            '--table-scroll-header-offset': internalScroll ? '0px' : undefined,
            '--table-viewport-width':
              viewportWidth > 0 ? viewportWidth + 'px' : undefined,
          } as CSSProperties
        }
        onScroll={updateMetrics}
      >
        {children}
      </ScrollArea>
      {internalScroll &&
        !horizontalOverflow &&
        scrollRange > 0 &&
        trackHeight > 0 && (
          <div
            className="absolute bottom-1 right-0.5 z-20 w-2 touch-none"
            style={{ top: trackTop }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={finishDrag}
            onPointerCancel={finishDrag}
            onLostPointerCapture={finishDrag}
          >
            <div
              role="scrollbar"
              tabIndex={0}
              aria-label="테이블 본문 세로 스크롤"
              aria-controls={viewportId}
              aria-orientation="vertical"
              aria-valuemin={0}
              aria-valuemax={Math.round(scrollRange)}
              aria-valuenow={Math.round(scrollTop)}
              className="absolute left-0.5 w-1 cursor-grab rounded-full bg-border-subtle hover:bg-text-tertiary active:cursor-grabbing focus-visible:outline-2 focus-visible:outline-action-primary"
              style={{
                height: thumbHeight,
                transform: `translateY(${thumbTop}px)`,
              }}
              onKeyDown={handleKeyDown}
            />
          </div>
        )}
    </div>
  );
};
