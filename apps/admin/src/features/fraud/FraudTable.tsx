import type { ReactNode } from 'react';

import {
  DataTable,
  type DataTableColumn,
  TableCell,
  type TableColumnSettingsState,
  type TableDensity,
  TableEmpty,
  TableError,
  TableHeaderCell,
  TableLoading,
  TableRow,
} from '@admin/ui/DataTable';

export interface FraudColumn<T> extends DataTableColumn {
  key: string;
  label: string;
  render: (row: T) => ReactNode;
  sortable?: boolean;
}
interface FraudTableProps<T> {
  label: string;
  rows: T[];
  columns: FraudColumn<T>[];
  rowKey: (row: T) => string | number;
  loading: boolean;
  error?: string;
  onRetry?: () => void;
  emptyMessage?: string;
  density: TableDensity;
  settings: TableColumnSettingsState;
  sortBy: string;
  sortDir: 'asc' | 'desc';
  onSort: (key: string) => void;
}
export const FraudTable = <T,>({
  label,
  rows,
  columns,
  rowKey,
  loading,
  error,
  onRetry,
  emptyMessage,
  density,
  settings,
  sortBy,
  sortDir,
  onSort,
}: FraudTableProps<T>) => (
  <DataTable
    aria-label={label}
    columns={columns}
    columnSettings={settings}
    density={density}
    resizableColumns
  >
    <thead>
      <tr>
        {columns.map((column, index) => (
          <TableHeaderCell
            key={column.key}
            columnIndex={index}
            sortDirection={
              column.sortable && sortBy === column.key ? sortDir : undefined
            }
            onSortChange={
              column.sortable ? () => onSort(column.key) : undefined
            }
          >
            {column.label}
          </TableHeaderCell>
        ))}
      </tr>
    </thead>
    <tbody>
      {loading ? (
        <tr>
          <TableLoading colSpan={columns.length} />
        </tr>
      ) : error ? (
        <tr>
          <TableError
            colSpan={columns.length}
            description={error}
            onRetry={onRetry}
          />
        </tr>
      ) : !rows.length ? (
        <tr>
          <TableEmpty colSpan={columns.length}>
            {emptyMessage ?? '조회된 내역이 없습니다.'}
          </TableEmpty>
        </tr>
      ) : (
        rows.map((row) => (
          <TableRow key={rowKey(row)}>
            {columns.map((column) => (
              <TableCell key={column.key}>{column.render(row)}</TableCell>
            ))}
          </TableRow>
        ))
      )}
    </tbody>
  </DataTable>
);
