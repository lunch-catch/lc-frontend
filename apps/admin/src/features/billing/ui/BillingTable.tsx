import { type ReactNode, useMemo } from 'react';
import { type DateRangeValue, SearchField, SelectField } from '@repo/ui';

import {
  queryChoice,
  queryPage,
  queryPastDate,
  querySize,
  queryText,
} from '@admin/hooks/urlQuery';
import { useUrlFilters } from '@admin/hooks/useUrlFilters';
import { useUrlSearch } from '@admin/hooks/useUrlSearch';
import {
  DataTable,
  TableCell,
  TableEmpty,
  TableError,
  TableHeaderCell,
  TableLoading,
  TableRow,
  type TableSortDirection,
  useTableColumnSettings,
} from '@admin/ui/DataTable';
import { AdminDateRangePicker } from '@admin/ui/DatePicker/AdminDateRangePicker';
import { FilterBar } from '@admin/ui/FilterBar/FilterBar';
import { PaginationSummary } from '@admin/ui/Pagination/PaginationSummary';

import { inDateRange } from '../billingUtils';
import type {
  BillingColumn,
  BillingRecord,
  BillingTablePreferences,
} from '../billingView';

interface Sort {
  index: number;
  direction: TableSortDirection;
}

interface BillingTableProps {
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
  queryPrefix: string;
  preferences: BillingTablePreferences;
  columns: BillingColumn[];
  rows: BillingRecord[] | ((range: DateRangeValue) => BillingRecord[]);
  statusOptions?: [string, string][];
  statusLabel?: string;
  defaultStatus?: string;
  defaultRange?: DateRangeValue;
  showSearch?: boolean;
  showDateRange?: boolean;
  extraFilters?: ReactNode;
  onRowClick?: (id: string) => void;
}

export const BillingTable = ({
  queryPrefix,
  columns,
  rows,
  statusOptions = [],
  statusLabel = '상태',
  defaultStatus = 'ALL',
  defaultRange = { startDate: '', endDate: '' },
  showSearch = true,
  showDateRange = true,
  extraFilters,
  onRowClick,
  preferences,
  loading = false,
  error,
  onRetry,
}: BillingTableProps) => {
  const tableColumns = columns.map((item) => ({
    align: item.align,
    key: item.label,
    label: item.label,
    width: item.width + '%',
  }));
  const columnSettings = useTableColumnSettings(
    'billing.' + columns.map((column) => column.label).join('|'),
    tableColumns,
  );
  const { density, setDensity } = preferences;
  const { filters, updateFilters } = useUrlFilters(queryPrefix, {
    keyword: queryText(),
    status: queryChoice(
      ['ALL', ...statusOptions.map(([value]) => value)],
      defaultStatus,
    ),
    from: queryPastDate(defaultRange.startDate),
    to: queryPastDate(defaultRange.endDate),
    page: queryPage,
    size: querySize,
    sortBy: queryChoice(['', ...columns.map((column) => column.label)], ''),
    sortDir: queryChoice(['asc', 'desc'] as const, 'desc'),
  });
  const { page, size: pageSize } = filters;
  const status = statusOptions.length ? filters.status : defaultStatus;
  const range = useMemo(
    () =>
      showDateRange
        ? { startDate: filters.from, endDate: filters.to }
        : defaultRange,
    [showDateRange, filters.from, filters.to, defaultRange],
  );
  const sort = useMemo<Sort | null>(
    () =>
      filters.sortBy
        ? {
            index: columns.findIndex(
              (column) => column.label === filters.sortBy,
            ),
            direction: filters.sortDir,
          }
        : null,
    [columns, filters.sortBy, filters.sortDir],
  );
  const search = useUrlSearch(filters.keyword, (keyword) =>
    updateFilters({ keyword, page: 1 }),
  );
  const { draftKeyword, setDraftKeyword } = search;
  const keyword = showSearch ? search.keyword : '';

  const records = useMemo(
    () => (typeof rows === 'function' ? rows(range) : rows),
    [rows, range],
  );
  const filteredRows = useMemo(() => {
    const query = keyword.trim().toLowerCase();
    return records
      .filter(
        (item) =>
          (!item.date ||
            inDateRange(item.date, range.startDate, range.endDate)) &&
          (status === 'ALL' || item.status === status) &&
          (!query || item.search.toLowerCase().includes(query)),
      )
      .sort((a, b) => {
        // 정렬을 해제하면 결제 시각·원장 일시·집계 일자 기준 최신순으로 돌아간다.
        if (!sort) return b.date.localeCompare(a.date);
        const first = a.cells[sort.index].value;
        const second = b.cells[sort.index].value;
        const comparison =
          typeof first === 'number' && typeof second === 'number'
            ? first - second
            : String(first).localeCompare(String(second), 'ko');
        return sort.direction === 'asc' ? comparison : -comparison;
      });
  }, [records, range, status, keyword, sort]);

  const totalPages = Math.ceil(filteredRows.length / pageSize);
  // 공유 URL의 페이지가 현재 결과 범위를 벗어나면 마지막 페이지까지만 표시한다.
  const currentPage = Math.min(page, Math.max(1, totalPages));

  const pagination = {
    currentPage,
    onPageChange: (page: number) => updateFilters({ page }),
    onPageSizeChange: (value: number) => {
      updateFilters({ size: value, page: 1 });
    },
    pageSize,
    totalCount: filteredRows.length,
    totalPages,
  };

  return (
    <>
      <FilterBar
        columnSettings={columnSettings}
        className="!px-0 !py-0"
        density={{ value: density, onValueChange: setDensity }}
        pagination={pagination}
      >
        {extraFilters ??
          (showSearch && (
            <SearchField
              value={draftKeyword}
              onChange={(event) => setDraftKeyword(event.target.value)}
            />
          ))}
        {statusOptions.length > 0 && (
          <SelectField
            aria-label={statusLabel}
            fitContent
            value={status}
            onValueChange={(value) => {
              updateFilters({ status: value, page: 1 });
            }}
            options={[
              { label: '전체', value: 'ALL' },
              ...statusOptions.map(([value, label]) => ({
                value,
                label,
              })),
            ]}
          />
        )}
        {showDateRange && (
          <AdminDateRangePicker
            ariaLabel="조회 기간"
            placeholder="조회 기간 선택"
            value={range}
            onValueChange={(value) => {
              updateFilters({
                from: value.startDate,
                to: value.endDate,
                page: 1,
              });
            }}
          />
        )}
      </FilterBar>
      <DataTable
        columnSettings={columnSettings}
        className="table-fixed"
        columns={tableColumns}
        density={density}
        resizableColumns
      >
        <thead>
          <tr>
            {columns.map((column, index) => (
              <TableHeaderCell
                key={column.label}
                columnIndex={index}
                sortDirection={
                  sort?.index === index ? sort.direction : undefined
                }
                onSortChange={() => {
                  updateFilters({
                    page: 1,
                    sortBy:
                      sort?.index !== index
                        ? column.label
                        : sort.direction === 'desc'
                          ? column.label
                          : '',
                    sortDir:
                      sort?.index === index && sort.direction === 'desc'
                        ? 'asc'
                        : 'desc',
                  });
                }}
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
          ) : (
            !filteredRows.length && (
              <tr>
                <TableEmpty colSpan={columns.length}>
                  조회된 내역이 없습니다.
                </TableEmpty>
              </tr>
            )
          )}
          {!loading &&
            !error &&
            filteredRows
              .slice((currentPage - 1) * pageSize, currentPage * pageSize)
              .map((record) => {
                const clickable = Boolean(onRowClick);
                return (
                  <TableRow
                    key={record.id}
                    showDetailArrow={clickable}
                    className={
                      clickable
                        ? 'cursor-pointer focus-visible:outline-2 focus-visible:outline-action-primary'
                        : undefined
                    }
                    tabIndex={clickable ? 0 : undefined}
                    role={clickable ? 'button' : undefined}
                    aria-label={
                      clickable ? record.id + ' 상세 보기' : undefined
                    }
                    onClick={
                      clickable ? () => onRowClick?.(record.id) : undefined
                    }
                    onKeyDown={
                      clickable
                        ? (event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault();
                              onRowClick?.(record.id);
                            }
                          }
                        : undefined
                    }
                  >
                    {record.cells.map((item, index) => (
                      <TableCell key={index} title={item.title}>
                        {item.content}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })}
        </tbody>
      </DataTable>
      <PaginationSummary {...pagination} />
    </>
  );
};
