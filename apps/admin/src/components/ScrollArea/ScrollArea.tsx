import {
  forwardRef,
  type HTMLAttributes,
  type PointerEvent,
  type ReactNode,
  useRef,
} from 'react';

export interface ScrollAreaProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  dragToScroll?: boolean;
  hideScrollbar?: boolean;
  orientation?: 'horizontal' | 'vertical';
}

export const ScrollArea = forwardRef<HTMLDivElement, ScrollAreaProps>(
  (
    {
      children,
      className,
      dragToScroll = false,
      hideScrollbar = false,
      onPointerCancel,
      onPointerDown,
      onPointerMove,
      onPointerUp,
      orientation = 'vertical',
      ...props
    },
    ref,
  ) => {
    const dragRef = useRef<{
      hasMoved: boolean;
      pointerId: number;
      startScrollLeft: number;
      startX: number;
    } | null>(null);

    const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
      onPointerDown?.(event);
      if (!dragToScroll || event.button !== 0) return;

      dragRef.current = {
        hasMoved: false,
        pointerId: event.pointerId,
        startScrollLeft: event.currentTarget.scrollLeft,
        startX: event.clientX,
      };
    };

    const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
      onPointerMove?.(event);
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== event.pointerId) return;

      const distance = event.clientX - drag.startX;
      if (Math.abs(distance) > 3) drag.hasMoved = true;
      if (!drag.hasMoved) return;

      event.currentTarget.scrollLeft = drag.startScrollLeft - distance;
      event.preventDefault();
    };

    const finishDrag = (event: PointerEvent<HTMLDivElement>) => {
      const drag = dragRef.current;
      if (drag?.pointerId === event.pointerId) {
        dragRef.current = null;
      }
    };

    return (
      <div
        className={[
          'min-h-0 flex-1',
          orientation === 'vertical'
            ? 'overflow-y-auto overscroll-y-contain'
            : 'overflow-x-auto overflow-y-hidden overscroll-x-contain',
          hideScrollbar
            ? '[scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
            : 'admin-scrollbar',
          dragToScroll && 'cursor-grab select-none active:cursor-grabbing',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        onPointerCancel={(event) => {
          onPointerCancel?.(event);
          finishDrag(event);
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={(event) => {
          onPointerUp?.(event);
          finishDrag(event);
        }}
        ref={ref}
        {...props}
      >
        {children}
      </div>
    );
  },
);

ScrollArea.displayName = 'ScrollArea';
