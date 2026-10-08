import type { ComponentType, ReactElement, ReactNode } from 'react';
import { Children, cloneElement, Fragment, isValidElement } from 'react';

import type { TableColumnPreference } from './dataTableTypes';

export const getTableSettingsId = (key: string) =>
  'table-settings-' + encodeURIComponent(key);

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

// 원래 셀 순서를 기준으로 헤더와 데이터를 함께 바꿔 정렬 이벤트와 표시값을 유지한다.
export const reorderTableChildren = (
  children: ReactNode,
  indexes: number[],
  columnCount: number,
  rowType: ComponentType<TableChildProps>,
  headerCellType: ComponentType<TableChildProps>,
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
          return isValidElement<TableChildProps>(cell) &&
            cell.type === headerCellType
            ? cloneElement(cell, { columnIndex: visibleIndex })
            : cell;
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
          ),
        );
  });
