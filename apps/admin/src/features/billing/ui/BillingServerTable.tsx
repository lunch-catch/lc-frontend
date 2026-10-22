import type { ReactNode } from 'react';

import {
  DataTable,
  type DataTableColumn,
  TableCell,
  TableEmpty,
  TableError,
  TableHeaderCell,
  TableLoading,
  TableRow,
  useTableColumnSettings,
} from '@admin/ui/DataTable';
import { FilterBar } from '@admin/ui/FilterBar/FilterBar';
import { PaginationSummary } from '@admin/ui/Pagination/PaginationSummary';

import type { BillingTablePreferences } from '../billingView';

export interface BillingServerColumn<T> extends DataTableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  render: (item: T) => ReactNode;
}
interface BillingServerTableProps<T> {
  heading?: string;
  description?: ReactNode;
  tableId: string;
  columns: BillingServerColumn<T>[];
  items: T[];
  rowId: (item: T) => string | number;
  loading: boolean;
  error?: string;
  onRetry?: () => void;
  emptyMessage: string;
  preferences: BillingTablePreferences;
  page: number;
  size: number;
  total: number;
  onPageChange: (page: number) => void;
  onSizeChange: (size: number) => void;
  sort?: { key: string; direction: 'asc' | 'desc' };
  onSort?: (key: string) => void;
  onOpen?: (item: T) => void;
  filters?: ReactNode;
}

/** 현재 페이지를 그대로 표시하고 검색·정렬·페이지 이동은 서버에 요청한다. */
export const BillingServerTable = <T,>({
  heading,
  description,
  tableId,
  columns,
  items,
  rowId,
  loading,
  error,
  onRetry,
  emptyMessage,
  preferences,
  page,
  size,
  total,
  onPageChange,
  onSizeChange,
  sort,
  onSort,
  onOpen,
  filters,
}: BillingServerTableProps<T>) => {
  const settings = useTableColumnSettings(tableId, columns);
  const pagination = {
    currentPage: page,
    pageSize: size,
    totalCount: total,
    totalPages: Math.ceil(total / size),
    onPageChange,
    onPageSizeChange: onSizeChange,
  };
  return (
    <>
      <FilterBar
        heading={heading}
        description={description}
        className="!px-0 !py-0"
        columnSettings={settings}
        density={{
          value: preferences.density,
          onValueChange: preferences.setDensity,
        }}
        pagination={pagination}
      >
        {filters}
      </FilterBar>
      <DataTable
        className="table-fixed"
        columns={columns}
        columnSettings={settings}
        density={preferences.density}
        resizableColumns
      >
        <thead>
          <tr>
            {columns.map((column, index) => (
              <TableHeaderCell
                key={column.key}
                columnIndex={index}
                onSortChange={
                  column.sortable && onSort
                    ? () => onSort(column.key)
                    : undefined
                }
                sortDirection={
                  sort?.key === column.key ? sort.direction : undefined
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
          ) : !items.length ? (
            <tr>
              <TableEmpty colSpan={columns.length}>{emptyMessage}</TableEmpty>
            </tr>
          ) : (
            items.map((item) => (
              <TableRow
                key={rowId(item)}
                showDetailArrow={Boolean(onOpen)}
                tabIndex={onOpen ? 0 : undefined}
                role={onOpen ? 'button' : undefined}
                aria-label={onOpen ? `${rowId(item)} 상세 보기` : undefined}
                className={
                  onOpen
                    ? 'cursor-pointer focus-visible:outline-2 focus-visible:outline-action-primary'
                    : undefined
                }
                onClick={onOpen ? () => onOpen(item) : undefined}
                onKeyDown={
                  onOpen
                    ? (event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          onOpen(item);
                        }
                      }
                    : undefined
                }
              >
                {columns.map((column) => (
                  <TableCell key={column.key}>{column.render(item)}</TableCell>
                ))}
              </TableRow>
            ))
          )}
        </tbody>
      </DataTable>
      <PaginationSummary {...pagination} />
    </>
  );
};
