import { useState } from 'react';
import { SearchField, SelectField, StatusBadge } from '@repo/ui';
import { formatDateTime, formatPoints, formatWon } from '@repo/utils';

import type { AdminPayment, PaymentSortKey } from '@admin/api/payments';
import { useUrlFilters } from '@admin/hooks/useUrlFilters';
import { useUrlSearch } from '@admin/hooks/useUrlSearch';
import { AdminDrawer } from '@admin/ui/AdminDrawer/AdminDrawer';
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
import { AdminDateRangePicker } from '@admin/ui/DatePicker/AdminDateRangePicker';
import { FilterBar } from '@admin/ui/FilterBar/FilterBar';
import { PaginationSummary } from '@admin/ui/Pagination/PaginationSummary';

import { paymentQuery } from '../billingQuery';
import type { BillingTablePreferences } from '../billingView';
import {
  getPaymentFilterError,
  paymentSearchOptions,
  paymentStatusLabels,
  paymentVariants,
} from '../paymentUtils';
import { PaymentDetails } from '../ui/PaymentDetails';
import { usePayments } from '../usePayments';

const columns: (DataTableColumn & { key: keyof AdminPayment })[] = [
  { key: 'requestedAt', label: '요청 시각', width: '12%', minWidth: 145 },
  { key: 'paymentId', label: '결제 ID', width: '8%', minWidth: 90 },
  { key: 'ownerId', label: '점주 ID', width: '8%', minWidth: 90 },
  { key: 'orderId', label: '주문 번호', width: '14%', minWidth: 140 },
  { key: 'pgTid', label: '거래 ID', width: '12%', minWidth: 120 },
  {
    key: 'amount',
    label: '결제 금액',
    width: '11%',
    minWidth: 115,
    align: 'right',
  },
  {
    key: 'chargedPoint',
    label: '충전 포인트',
    width: '11%',
    minWidth: 120,
    align: 'right',
  },
  { key: 'status', label: '상태', width: '10%', minWidth: 125 },
  { key: 'approvedAt', label: '승인 시각', width: '14%', minWidth: 180 },
];
const sortKeys = new Set<string>(['requestedAt', 'amount', 'approvedAt']);

interface PaymentHistoryTabProps {
  preferences: BillingTablePreferences;
}

export const PaymentHistoryTab = ({ preferences }: PaymentHistoryTabProps) => {
  const { density, setDensity } = preferences;
  // 기존 테이블의 저장 키를 유지해 남아 있는 열의 계정별 설정을 재사용한다.
  const columnSettings = useTableColumnSettings(
    'billing.결제 ID|점주 ID|결제 금액|충전 포인트|상태|결제 시각',
    columns.map((column) => ({ ...column, key: column.label })),
  );
  const { filters, updateFilters } = useUrlFilters('payments.', paymentQuery);
  const { page, size: pageSize, status, searchType } = filters;
  const range = { startDate: filters.from, endDate: filters.to };
  const sort = filters.sortBy
    ? { key: filters.sortBy, direction: filters.sortDir }
    : null;
  const [selected, setSelected] = useState<AdminPayment | null>(null);
  const search = useUrlSearch(filters.keyword, (keyword) => {
    updateFilters({ keyword, page: 1 });
    setSelected(null);
  });
  const keyword = search.keyword.trim();
  const inputPending = search.draftKeyword !== search.keyword;
  const validationError = getPaymentFilterError(
    range.startDate,
    range.endDate,
    searchType,
    keyword,
  );
  // 화면은 1부터, 서버는 0부터 페이지를 센다. 검색·정렬은 전체 목록 기준으로 서버에 맡긴다.
  const query = new URLSearchParams({
    page: String(page - 1),
    size: String(pageSize),
  });
  if (keyword) {
    query.set('searchType', searchType);
    query.set('keyword', keyword);
  }
  if (status !== 'ALL') query.set('status', status);
  if (range.startDate) query.set('from', range.startDate);
  if (range.endDate) query.set('to', range.endDate);
  if (sort) {
    query.set('sortBy', sort.key);
    query.set('sortDir', sort.direction);
  }
  const payments = usePayments(
    !inputPending && !validationError ? query.toString() : null,
  );
  const items = payments.data?.items ?? [];
  // 목록을 갱신하는 동안에도 선택한 결제와 재조회 결과를 상세 패널에 유지한다.
  const selectedPayment = selected
    ? (items.find((item) => item.paymentId === selected.paymentId) ?? selected)
    : null;
  const totalCount = payments.data?.totalElements ?? 0;
  const pagination = {
    currentPage: page,
    pageSize,
    totalCount,
    totalPages: Math.ceil(totalCount / pageSize),
    onPageChange: (next: number) => {
      updateFilters({ page: next });
      setSelected(null);
    },
    onPageSizeChange: (next: number) => {
      updateFilters({ size: next, page: 1 });
      setSelected(null);
    },
  };
  const refreshAfterRecheck = () => {
    // 상태 변경으로 마지막 페이지가 비어도 첫 페이지부터 유효한 결과를 보여 준다.
    updateFilters({ page: 1 }, true);
    payments.refresh();
  };
  const changeSort = (key: PaymentSortKey) => {
    setSelected(null);
    updateFilters({
      page: 1,
      sortBy: sort?.key !== key ? key : sort.direction === 'desc' ? key : '',
      sortDir: sort?.key === key && sort.direction === 'desc' ? 'asc' : 'desc',
    });
  };

  return (
    <>
      <FilterBar
        className="!px-0 !py-0"
        columnSettings={columnSettings}
        density={{ value: density, onValueChange: setDensity }}
        pagination={pagination}
      >
        <SelectField
          fitContent
          aria-label="결제 검색 종류"
          value={searchType}
          options={paymentSearchOptions}
          onValueChange={(value) => {
            search.setDraftKeyword('');
            updateFilters({
              searchType: value as typeof searchType,
              keyword: '',
              page: 1,
            });
            setSelected(null);
          }}
        />
        <SearchField
          aria-label="결제 검색어"
          placeholder={`${paymentSearchOptions.find((option) => option.value === searchType)?.label ?? '결제 정보'} 검색`}
          value={search.draftKeyword}
          onChange={(event) => search.setDraftKeyword(event.target.value)}
        />
        <SelectField
          fitContent
          aria-label="결제 상태"
          value={status}
          options={[
            { label: '상태 전체', value: 'ALL' },
            ...Object.entries(paymentStatusLabels).map(([value, label]) => ({
              value,
              label,
            })),
          ]}
          onValueChange={(value) => {
            updateFilters({ status: value as typeof status, page: 1 });
            setSelected(null);
          }}
        />
        <AdminDateRangePicker
          ariaLabel="결제 요청일 범위"
          placeholder="요청일 범위 선택"
          value={range}
          onValueChange={(value) => {
            updateFilters({
              from: value.startDate,
              to: value.endDate,
              page: 1,
            });
            setSelected(null);
          }}
        />
      </FilterBar>
      {validationError && !inputPending && (
        <p role="alert" className="text-caption-web text-status-danger-fg">
          {validationError}
        </p>
      )}
      <DataTable
        className="table-fixed"
        columns={columns}
        columnSettings={columnSettings}
        density={density}
        resizableColumns
      >
        <thead>
          <tr>
            {columns.map((column, index) => (
              <TableHeaderCell
                key={column.key}
                columnIndex={index}
                onSortChange={
                  sortKeys.has(column.key)
                    ? () => changeSort(column.key as PaymentSortKey)
                    : undefined
                }
                sortDirection={
                  sort && sort.key === column.key ? sort.direction : undefined
                }
              >
                {column.label}
              </TableHeaderCell>
            ))}
          </tr>
        </thead>
        <tbody>
          {payments.loading || inputPending ? (
            <tr>
              <TableLoading colSpan={columns.length} />
            </tr>
          ) : validationError || payments.error ? (
            <tr>
              <TableError
                colSpan={columns.length}
                description={validationError || payments.error}
                onRetry={!validationError ? payments.refresh : undefined}
              />
            </tr>
          ) : !items.length ? (
            <tr>
              <TableEmpty colSpan={columns.length}>
                조회된 결제 내역이 없습니다.
              </TableEmpty>
            </tr>
          ) : (
            items.map((item) => (
              <TableRow
                key={item.paymentId}
                showDetailArrow
                tabIndex={0}
                role="button"
                aria-description={`결제 ${item.paymentId} 상세 보기`}
                className="cursor-pointer focus-visible:outline-2 focus-visible:outline-action-primary"
                onClick={() => setSelected(item)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    setSelected(item);
                  }
                }}
              >
                <TableCell title={formatDateTime(item.requestedAt)}>
                  {formatDateTime(item.requestedAt)}
                </TableCell>
                <TableCell>{item.paymentId}</TableCell>
                <TableCell>{item.ownerId}</TableCell>
                <TableCell title={item.orderId}>{item.orderId}</TableCell>
                <TableCell title={item.pgTid ?? undefined}>
                  {item.pgTid ?? '—'}
                </TableCell>
                <TableCell>{formatWon(item.amount)}</TableCell>
                <TableCell>{formatPoints(item.chargedPoint)}</TableCell>
                <TableCell>
                  <StatusBadge variant={paymentVariants[item.status]}>
                    {paymentStatusLabels[item.status]}
                  </StatusBadge>
                </TableCell>
                <TableCell>
                  {item.approvedAt ? formatDateTime(item.approvedAt) : '—'}
                </TableCell>
              </TableRow>
            ))
          )}
        </tbody>
      </DataTable>
      <PaginationSummary
        {...pagination}
        totalCount={payments.data?.totalElements}
      />
      <AdminDrawer
        open={selectedPayment !== null}
        onClose={() => setSelected(null)}
        title="결제 상세"
        resizable
      >
        {selectedPayment && (
          <PaymentDetails
            key={selectedPayment.paymentId}
            payment={selectedPayment}
            onRefresh={refreshAfterRecheck}
            onRechecked={(updated) => {
              setSelected(updated);
              refreshAfterRecheck();
            }}
          />
        )}
      </AdminDrawer>
    </>
  );
};
