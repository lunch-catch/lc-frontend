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
  key?: string;
  label?: string;
  minWidth?: number;
  width?: CSSProperties['width'];
}

export interface DataTableProps extends TableHTMLAttributes<HTMLTableElement> {
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
