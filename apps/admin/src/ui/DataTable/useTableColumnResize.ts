import type { PointerEvent } from 'react';
import { useRef, useState } from 'react';

import type { DataTableColumn } from './dataTableTypes';

const defaultColumnMinWidth = 80;

export const useTableColumnResize = (columns?: DataTableColumn[]) => {
  const tableRef = useRef<HTMLTableElement>(null);
  const [resizedColumnWidths, setResizedColumnWidths] = useState<number[]>();
  const tableColumns = columns ?? [];

  const handleResizeStart = (
    columnIndex: number,
    event: PointerEvent<HTMLButtonElement>,
  ) => {
    const headerCells = Array.from(
      tableRef.current?.querySelectorAll('thead th') ?? [],
    );
    const nextColumnIndex = columnIndex + 1;
    const currentHeader = headerCells[columnIndex];
    const nextHeader = headerCells[nextColumnIndex];

    if (!currentHeader || !nextHeader) {
      return;
    }

    event.preventDefault();

    const startWidths = headerCells.map(
      (header) => header.getBoundingClientRect().width,
    );
    const startX = event.clientX;
    const currentMinWidth = Math.min(
      tableColumns[columnIndex]?.minWidth ?? defaultColumnMinWidth,
      startWidths[columnIndex],
    );
    const nextMinWidth = Math.min(
      tableColumns[nextColumnIndex]?.minWidth ?? defaultColumnMinWidth,
      startWidths[nextColumnIndex],
    );
    const maxCurrentWidth =
      startWidths[columnIndex] + startWidths[nextColumnIndex] - nextMinWidth;
    let hasMoved = false;
    let animationFrameId: number | undefined;
    let latestDelta = 0;

    const applyResize = () => {
      animationFrameId = undefined;
      const currentWidth = Math.max(
        currentMinWidth,
        Math.min(startWidths[columnIndex] + latestDelta, maxCurrentWidth),
      );
      const nextWidth =
        startWidths[nextColumnIndex] -
        (currentWidth - startWidths[columnIndex]);

      setResizedColumnWidths(
        startWidths.map((width, index) => {
          if (index === columnIndex) {
            return currentWidth;
          }

          if (index === nextColumnIndex) {
            return nextWidth;
          }

          return width;
        }),
      );
    };

    const handlePointerMove = (moveEvent: globalThis.PointerEvent) => {
      const delta = moveEvent.clientX - startX;

      if (!hasMoved && Math.abs(delta) < 4) {
        return;
      }

      hasMoved = true;
      latestDelta = delta;

      if (animationFrameId === undefined) {
        // 포인터 이동마다 렌더링하지 않고 화면 프레임에 맞춰 열 너비를 갱신한다.
        animationFrameId = window.requestAnimationFrame(applyResize);
      }
    };

    const handlePointerUp = () => {
      if (animationFrameId !== undefined) {
        window.cancelAnimationFrame(animationFrameId);
        applyResize();
      }

      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    event.currentTarget.setPointerCapture(event.pointerId);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  return { tableRef, tableColumns, resizedColumnWidths, handleResizeStart };
};
