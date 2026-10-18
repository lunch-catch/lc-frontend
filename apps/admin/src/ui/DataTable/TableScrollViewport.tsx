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
  if (maxHeight === undefined) return <>{children}</>;

  return (
    <div className="relative">
      <ScrollArea
        hideScrollbar
        ref={viewportRef}
        id={viewportId}
        tabIndex={0}
        aria-label="테이블 내용"
        role="region"
        className="flex-none !overflow-auto [scrollbar-gutter:auto] focus-visible:outline-2 focus-visible:outline-action-primary"
        style={{ maxHeight }}
        onScroll={updateMetrics}
      >
        {children}
      </ScrollArea>
      {scrollRange > 0 && trackHeight > 0 && (
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
