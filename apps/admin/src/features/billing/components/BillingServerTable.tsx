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
} from '@admin/components/DataTable';
import { FilterBar } from '@admin/components/FilterBar/FilterBar';
import { PaginationSummary } from '@admin/components/Pagination/PaginationSummary';
import { ScrollArea } from '@admin/components/ScrollArea/ScrollArea';
import type { BillingTablePreferences } from '@admin/features/billing/billingView';

export interface BillingServerColumn<T> extends DataTableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  render: (item: T) => ReactNode;
}
interface BillingServerTableProps<T> {
  tableId: string;
  columns: BillingServerColumn<T>[];
  items: T[];
  rowId: (item: T) => string | number;
  loading: boolean;
  error?: string;
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
  tableId,
  columns,
  items,
  rowId,
  loading,
  error,
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
  const visibleKeys = new Set(
    settings.preferences
      .filter((field) => field.visible)
      .map((field) => field.key),
  );
  // 좁은 화면에서는 금액과 열 제목을 억지로 줄이지 않고 표시 중인 열만 가로로 스크롤한다.
  const minWidth = columns
    .filter((column) => visibleKeys.has(column.key))
    .reduce((sum, column) => sum + (column.minWidth ?? 100), 0);
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
      <ScrollArea
        orientation="horizontal"
        className="w-full !flex-none"
        aria-label="목록 가로 스크롤"
        tabIndex={0}
      >
        <DataTable
          className="table-fixed"
          style={{ minWidth }}
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
                <TableError colSpan={columns.length} description={error} />
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
                    <TableCell key={column.key}>
                      {column.render(item)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </tbody>
        </DataTable>
      </ScrollArea>
      <PaginationSummary {...pagination} />
    </>
  );
};
