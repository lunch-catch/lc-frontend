import {
  cloneElement,
  memo,
  type ReactElement,
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

import type { TableDensity, TableRowProps } from './dataTableTypes';

const virtualizationThreshold = 100;
const initialRowCount = 20;
// TableCell의 고정 행 높이와 일치해야 여백 행과 실제 행의 위치가 맞는다.
const rowHeights: Record<TableDensity, number> = {
  compact: 40,
  normal: 48,
  comfortable: 56,
};

interface VirtualTableRowsProps<T> {
  items: T[];
  getKey: (item: T) => string | number;
  colSpan: number;
  density: TableDensity;
  renderRow: (item: T) => ReactElement<TableRowProps>;
}

interface VirtualRowProps<T> {
  item: T;
  index: number;
  renderRow: (item: T) => ReactElement<TableRowProps>;
}
const VirtualRowContent = <T,>({
  item,
  index,
  renderRow,
}: VirtualRowProps<T>) =>
  cloneElement(renderRow(item), {
    'data-index': index,
    'aria-rowindex': index + 2,
  } as TableRowProps);
// 스크롤 창이 이동해도 겹치는 행의 셀과 이벤트 핸들러를 다시 생성하지 않는다.
const VirtualRow = memo(VirtualRowContent) as typeof VirtualRowContent;

/** 한 줄짜리 고정 높이 커서 목록에서 전체 데이터는 유지하고 화면 주변 행만 렌더링한다. */
export const VirtualTableRows = <T,>({
  items,
  getKey,
  colSpan,
  density,
  renderRow,
}: VirtualTableRowsProps<T>) => {
  'use no memo'; // 가상화 인스턴스의 가변 측정값은 React Compiler가 캐시하지 않는다.
  const anchor = useRef<HTMLTableRowElement>(null);
  const [scrollMargin, setScrollMargin] = useState(0);
  const enabled = items.length > virtualizationThreshold;
  const [scrollElement, setScrollElement] = useState<HTMLElement | null>(null);
  const getScrollElement = useCallback(() => scrollElement, [scrollElement]);
  const getItemKey = useCallback(
    (index: number) => getKey(items[index]),
    [getKey, items],
  );
  // 위의 use no memo로 컴파일을 제외한 범위에서만 가변 인스턴스를 사용한다.
  // eslint-disable-next-line react-hooks/incompatible-library
  const virtualizer = useVirtualizer<HTMLElement, HTMLTableRowElement>({
    count: items.length,
    getScrollElement,
    getItemKey,
    estimateSize: () => rowHeights[density],
    overscan: 4,
    scrollMargin,
    enabled,
  });

  useLayoutEffect(() => {
    if (!enabled) return;
    const row = anchor.current;
    const main = row?.closest('main');
    const table = row?.closest('table');
    if (!row || !main || !table) return;
    const viewport = table.closest('[role="region"]');
    const measureOffset = () => {
      // 좁은 화면의 테이블 내부 스크롤과 넓은 화면의 페이지 스크롤을 모두 지원한다.
      const target =
        viewport instanceof HTMLElement &&
        /auto|scroll/.test(getComputedStyle(viewport).overflowY)
          ? viewport
          : main;
      setScrollElement(target);
      setScrollMargin(
        row.getBoundingClientRect().top -
          target.getBoundingClientRect().top +
          target.scrollTop,
      );
    };
    measureOffset();
    const observer = new ResizeObserver(measureOffset);
    observer.observe(main);
    observer.observe(table);
    if (viewport) observer.observe(viewport);
    return () => observer.disconnect();
  }, [enabled]);

  useLayoutEffect(() => {
    virtualizer.measure();
  }, [density, virtualizer]);
  const windowRows = enabled ? virtualizer.getVirtualItems() : [];
  const first = windowRows[0];
  const last = windowRows.at(-1);
  const top = first ? Math.max(0, first.start - scrollMargin) : 0;
  const bottom = last
    ? Math.max(0, virtualizer.getTotalSize() - (last.end - scrollMargin))
    : 0;

  return (
    <>
      <tr ref={anchor} aria-hidden="true">
        <td colSpan={colSpan} style={{ height: top, padding: 0, border: 0 }} />
      </tr>
      {enabled && windowRows.length
        ? windowRows.map((row) => (
            <VirtualRow
              key={row.key}
              item={items[row.index]}
              index={row.index}
              renderRow={renderRow}
            />
          ))
        : items
            .slice(0, enabled ? initialRowCount : items.length)
            .map((item, index) => (
              <VirtualRow
                key={getKey(item)}
                item={item}
                index={index}
                renderRow={renderRow}
              />
            ))}
      {bottom > 0 && (
        <tr aria-hidden="true">
          <td
            colSpan={colSpan}
            style={{ height: bottom, padding: 0, border: 0 }}
          />
        </tr>
      )}
    </>
  );
};
