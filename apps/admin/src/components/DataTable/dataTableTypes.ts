import type {
  CSSProperties,
  HTMLAttributes,
  PointerEvent,
  TableHTMLAttributes,
  TdHTMLAttributes,
  ThHTMLAttributes,
} from 'react';

export type TableDensity = 'compact' | 'normal' | 'comfortable';
export type TableSortDirection = 'asc' | 'desc';

export interface DataTableColumn {
  /** 값의 자료형과 관계없이 헤더와 셀에 적용할 정렬 방향. 기본값은 left. */
  align?: 'left' | 'center' | 'right';
  key?: string;
  label?: string;
  minWidth?: number;
  width?: CSSProperties['width'];
}

export interface DataTableProps extends TableHTMLAttributes<HTMLTableElement> {
  /** 외곽 테두리를 고정하고 안쪽 내용만 스크롤할 때 사용할 최대 높이. */
  scrollMaxHeight?: CSSProperties['maxHeight'];
  /** 내부 스크롤 테이블은 0, 페이지 스크롤 테이블은 기본 오프셋을 사용한다. */
  stickyHeaderOffset?: CSSProperties['top'];
  columnSettings?: TableColumnSettingsState;
  personalizationKey?: string;
  columns?: DataTableColumn[];
  density?: TableDensity;
  resizableColumns?: boolean;
}

export interface TableColumnPreference {
  key: string;
  visible: boolean;
}

export interface TableColumnSettingsState {
  fields: { key: string; label: string }[];
  preferences: TableColumnPreference[];
  applyPreferences: (next: TableColumnPreference[]) => void;
  storageError: string;
}
export interface TableHeaderCellProps extends ThHTMLAttributes<HTMLTableCellElement> {
  columnIndex?: number;
  onSortChange?: () => void;
  sortDirection?: TableSortDirection;
}
export type TableCellProps = TdHTMLAttributes<HTMLTableCellElement>;

export interface TableRowProps extends HTMLAttributes<HTMLTableRowElement> {
  /** 상세 패널을 여는 행의 마지막 표시 셀에 화살표를 표시한다. */
  showDetailArrow?: boolean;
}

export interface TableStateProps extends TdHTMLAttributes<HTMLTableCellElement> {
  colSpan: number;
}

export interface TableErrorProps extends TableStateProps {
  description?: string;
  title?: string;
}

export interface TableResizeContextValue {
  columns: DataTableColumn[];
  onResizeStart?: (
    columnIndex: number,
    event: PointerEvent<HTMLButtonElement>,
  ) => void;
  resizableColumns: boolean;
}
