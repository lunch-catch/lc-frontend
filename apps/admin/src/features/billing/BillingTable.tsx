import { type ReactNode, useEffect, useMemo, useState } from 'react';
import {
  DateRangePicker,
  type DateRangeValue,
  SearchField,
  SelectField,
} from '@repo/ui';
import { ChevronRight, RotateCcw } from 'lucide-react';

import {
  DataTable,
  TableCell,
  TableEmpty,
  TableHeaderCell,
  TableRow,
  type TableSortDirection,
} from '@admin/components/DataTable/DataTable';
import { FilterBar } from '@admin/components/FilterBar/FilterBar';
import { Pagination } from '@admin/components/Pagination/Pagination';
import { TableDensityControl } from '@admin/components/TableDensityControl/TableDensityControl';

import { inDateRange } from './billingData';
import type {
  BillingColumn,
  BillingRecord,
  BillingTablePreferences,
} from './billingView';
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
  renderSummary?: (range: DateRangeValue) => ReactNode;
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
  renderSummary,
  onRowClick,
  preferences,
}: BillingTableProps) => {
  const { density, setDensity, pageSize, setPageSize } = preferences;
  const [draftKeyword, setDraftKeyword] = useState('');
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState(defaultStatus);
  const [range, setRange] = useState<DateRangeValue>(() => ({
    ...defaultRange,
  }));
  const [sort, setSort] = useState<Sort | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    // 검색 입력은 300ms 동안 기다리고, 상태·기간 선택은 즉시 목록에 반영한다.
    const timer = window.setTimeout(() => {
      setKeyword(draftKeyword);
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [draftKeyword]);
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

  const resetFilters = () => {
    setDraftKeyword('');
    setKeyword('');
    setStatus(defaultStatus);
    setRange({ ...defaultRange });
    setSort(null);
    setPage(1);
  };
  // 다른 탭에서 페이지당 개수가 바뀌어도 현재 목록의 유효 페이지 범위를 지킨다.
  const currentPage = Math.min(
    page,
    Math.max(1, Math.ceil(filteredRows.length / pageSize)),
  );
  return (
    <>
      <FilterBar className="!px-0 !py-0">
        <div className="flex w-full flex-wrap items-center justify-between gap-3">
          <TableDensityControl value={density} onValueChange={setDensity} />
          <div className="ml-auto flex flex-wrap items-center justify-end gap-3">
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
            <button
              aria-label="필터 초기화"
              type="button"
              onClick={resetFilters}
              className="flex size-10 cursor-pointer items-center justify-center text-action-primary focus-visible:outline-2 focus-visible:outline-action-primary"
            >
              <RotateCcw aria-hidden="true" className="size-4" />
            </button>
          </div>
        </div>
      </FilterBar>
      {renderSummary?.(range)}
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
      <Pagination
        currentPage={currentPage}
        onPageChange={setPage}
        pageSize={pageSize}
        pageSizeOptions={[5, 10, 20, 50]}
        onPageSizeChange={(value) => {
          setPageSize(value);
          setPage(1);
        }}
        totalCount={filteredRows.length}
        totalPages={Math.ceil(filteredRows.length / pageSize)}
      />
    </>
  );
};
