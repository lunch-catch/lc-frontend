import { type ReactNode, useMemo, useState } from 'react';
import {
  DateRangePicker,
  type DateRangeValue,
  SearchField,
  SelectField,
} from '@repo/ui';
import { ChevronRight } from 'lucide-react';

import {
  DataTable,
  TableCell,
  TableEmpty,
  TableHeaderCell,
  TableRow,
  type TableSortDirection,
} from '@admin/components/DataTable';
import { FilterBar } from '@admin/components/FilterBar/FilterBar';
import { PaginationSummary } from '@admin/components/Pagination/PaginationSummary';
import { inDateRange } from '@admin/features/billing/billingUtils';
import type {
  BillingColumn,
  BillingRecord,
  BillingTablePreferences,
} from '@admin/features/billing/billingView';
import { useDebouncedSearch } from '@admin/hooks/useDebouncedSearch';

interface Sort {
  index: number;
  direction: TableSortDirection;
}

interface BillingTableProps {
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
}: BillingTableProps) => {
  const { density, setDensity, pageSize, setPageSize } = preferences;
  const [status, setStatus] = useState(defaultStatus);
  const [range, setRange] = useState<DateRangeValue>(() => ({
    ...defaultRange,
  }));
  const [sort, setSort] = useState<Sort | null>(null);
  const [page, setPage] = useState(1);
  const { draftKeyword, keyword, setDraftKeyword } = useDebouncedSearch({
    onCommit: () => setPage(1),
  });

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
  // 다른 탭에서 개수가 바뀌면 실제 목록 페이지를 제한하고, 빈 목록의 상태값은 1로 유지한다.
  const currentPage = Math.min(page, Math.max(1, totalPages));

  const pagination = {
    currentPage,
    onPageChange: setPage,
    onPageSizeChange: (value: number) => {
      // 정산 탭끼리 공유하는 개수가 바뀌면 현재 탭의 페이지는 첫 페이지로 돌린다.
      setPageSize(value);
      setPage(1);
    },
    pageSize,
    totalCount: filteredRows.length,
    totalPages,
  };

  return (
    <>
      <FilterBar
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
              setStatus(value);
              setPage(1);
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
          <div className="w-[216px]">
            <DateRangePicker
              ariaLabel="조회 기간"
              placeholder="조회 기간 선택"
              value={range}
              onValueChange={(value) => {
                setRange(value);
                setPage(1);
              }}
            />
          </div>
        )}
      </FilterBar>
      <DataTable
        className="table-fixed"
        columns={columns.map((item) => ({ width: item.width + '%' }))}
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
                  setPage(1);
                  setSort((current) =>
                    !current || current.index !== index
                      ? { index, direction: 'desc' }
                      : current.direction === 'desc'
                        ? { index, direction: 'asc' }
                        : null,
                  );
                }}
              >
                {column.label}
              </TableHeaderCell>
            ))}
          </tr>
        </thead>
        <tbody>
          {!filteredRows.length && (
            <tr>
              <TableEmpty colSpan={columns.length}>
                조회된 내역이 없습니다.
              </TableEmpty>
            </tr>
          )}
          {filteredRows
            .slice((currentPage - 1) * pageSize, currentPage * pageSize)
            .map((record) => {
              const clickable = Boolean(onRowClick);
              return (
                <TableRow
                  key={record.id}
                  className={
                    clickable
                      ? 'cursor-pointer focus-visible:outline-2 focus-visible:outline-action-primary'
                      : undefined
                  }
                  tabIndex={clickable ? 0 : undefined}
                  role={clickable ? 'button' : undefined}
                  aria-label={clickable ? record.id + ' 상세 보기' : undefined}
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
                    <TableCell
                      key={index}
                      title={item.title}
                      className={
                        index === record.cells.length - 1 && clickable
                          ? 'relative !pr-10'
                          : undefined
                      }
                    >
                      {item.content}
                      {index === record.cells.length - 1 && clickable && (
                        <ChevronRight
                          aria-hidden="true"
                          className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100"
                        />
                      )}
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
