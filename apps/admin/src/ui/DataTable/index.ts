import {
  DataTableRoot,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
} from './DataTable';
import { TableEmpty, TableError, TableLoading } from './TableStates';

export const DataTable = Object.assign(DataTableRoot, {
  Header: TableHeader,
  HeaderCell: TableHeaderCell,
  Cell: TableCell,
  Row: TableRow,
  Empty: TableEmpty,
  Loading: TableLoading,
  Error: TableError,
});

export {
  TableCell,
  TableEmpty,
  TableError,
  TableHeader,
  TableHeaderCell,
  TableLoading,
  TableRow,
};
export type {
  DataTableColumn,
  DataTableProps,
  TableCellProps,
  TableColumnSettingsState,
  TableDensity,
  TableErrorProps,
  TableHeaderCellProps,
  TableRowProps,
  TableSortDirection,
  TableStateProps,
} from './dataTableTypes';
export { useTableColumnSettings } from './useTableColumnSettings';
