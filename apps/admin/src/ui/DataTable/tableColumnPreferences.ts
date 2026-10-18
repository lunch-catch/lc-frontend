import type {
  ComponentType,
  CSSProperties,
  ReactElement,
  ReactNode,
} from 'react';
import { Children, cloneElement, Fragment, isValidElement } from 'react';

import type { DataTableColumn, TableColumnPreference } from './dataTableTypes';

export const normalizeColumnPreferences = (
  keys: string[],
  saved: unknown,
): TableColumnPreference[] => {
  const result: TableColumnPreference[] = [];
  if (Array.isArray(saved)) {
    for (const item of saved) {
      if (
        item &&
        typeof item === 'object' &&
        typeof item.key === 'string' &&
        typeof item.visible === 'boolean' &&
        keys.includes(item.key) &&
        !result.some((entry) => entry.key === item.key)
      ) {
        result.push({ key: item.key, visible: item.visible });
      }
    }
  }
  for (const key of keys) {
    if (!result.some((item) => item.key === key))
      result.push({ key, visible: true });
  }
  if (result.length && !result.some((item) => item.visible))
    result[0].visible = true;
  return result;
};

interface TableChildProps {
  style?: CSSProperties;
  children?: ReactNode;
  columnIndex?: number;
  colSpan?: number;
}

const flattenChildren = (children: ReactNode): ReactNode[] =>
  Children.toArray(children).flatMap((child) =>
    isValidElement<TableChildProps>(child) && child.type === Fragment
      ? flattenChildren(child.props.children)
      : [child],
  );

export const alignTableCells = (
  children: ReactNode,
  columns: DataTableColumn[],
): ReactNode => {
  if (!columns.some((column) => column.align)) return children;
  const cells = flattenChildren(children);
  if (cells.length !== columns.length) return children;
  return cells.map((cell, index) => {
    const align = columns[index]?.align;
    if (
      !align ||
      !isValidElement<TableChildProps>(cell) ||
      cell.props.colSpan !== undefined
    )
      return cell;
    return cloneElement(cell, {
      style: { ...cell.props.style, textAlign: align },
    });
  });
};

// 원래 셀 순서를 기준으로 헤더와 데이터를 함께 바꿔 정렬 이벤트와 표시값을 유지한다.
export const reorderTableChildren = (
  children: ReactNode,
  indexes: number[],
  columnCount: number,
  rowType: ComponentType<TableChildProps>,
  headerCellType: ComponentType<TableChildProps>,
  columns?: DataTableColumn[],
): ReactNode =>
  flattenChildren(children).map((child) => {
    if (!isValidElement<TableChildProps>(child)) return child;
    const cells = flattenChildren(child.props.children);
    if (child.type === 'tr' || child.type === rowType) {
      const stateCell =
        cells.length === 1 &&
        isValidElement<TableChildProps>(cells[0]) &&
        (cells[0].props.colSpan ?? 1) > 1
          ? (cells[0] as ReactElement<TableChildProps>)
          : undefined;
      if (stateCell)
        return cloneElement(
          child,
          {},
          cloneElement(stateCell, { colSpan: indexes.length }),
        );
      if (cells.length !== columnCount) return child;
      return cloneElement(
        child,
        {},
        indexes.map((originalIndex, visibleIndex) => {
          const cell = cells[originalIndex];
          if (!isValidElement<TableChildProps>(cell)) return cell;
          const align = columns?.[originalIndex]?.align;
          // 정렬은 표시 순서에 맞는 열에서 읽으며 전체 열을 합친 상태 안내 행에는 적용하지 않는다.
          return cloneElement(cell, {
            ...(cell.type === headerCellType
              ? { columnIndex: visibleIndex }
              : {}),
            ...(align
              ? { style: { ...cell.props.style, textAlign: align } }
              : {}),
          });
        }),
      );
    }
    return child.props.children === undefined
      ? child
      : cloneElement(
          child,
          {},
          reorderTableChildren(
            child.props.children,
            indexes,
            columnCount,
            rowType,
            headerCellType,
            columns,
          ),
        );
  });
