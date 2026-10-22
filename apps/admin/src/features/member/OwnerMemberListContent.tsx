import { useState } from 'react';
import { SearchField, SelectField, StatusBadge } from '@repo/ui';
import { formatDateTime } from '@repo/utils';

import { getOwners, type OwnerStatus } from '@admin/api/owners';
import {
  queryChoice,
  queryPage,
  queryPastDate,
  queryText,
} from '@admin/hooks/urlQuery';
import { useApiResource } from '@admin/hooks/useApiResource';
import { useUrlFilters } from '@admin/hooks/useUrlFilters';
import { useUrlSearch } from '@admin/hooks/useUrlSearch';
import {
  DataTable,
  TableCell,
  type TableDensity,
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

const columns = [
  { key: 'joinedAt', label: '가입일', minWidth: 170 },
  { key: 'ownerId', label: '점주 ID', minWidth: 100 },
  { key: 'storeName', label: '상호', minWidth: 150 },
  { key: 'status', label: '상태', minWidth: 100 },
  { key: 'storeRegistered', label: '가게 등록', minWidth: 110 },
  { key: 'businessNo', label: '사업자번호', minWidth: 140 },
  { key: 'lastLoginAt', label: '최근 로그인', minWidth: 170 },
];
const statuses: Record<
  OwnerStatus,
  { label: string; variant: 'neutral' | 'success' | 'warning' | 'danger' }
> = {
  ONBOARDING: { label: '가입 진행 중', variant: 'neutral' },
  ACTIVE: { label: '활성', variant: 'success' },
  SUSPENDED: { label: '정지', variant: 'warning' },
  WITHDRAWN: { label: '탈퇴', variant: 'danger' },
};
export const OwnerMemberListContent = () => {
  const { filters, updateFilters } = useUrlFilters('owners.', {
    keyword: queryText(),
    status: queryChoice(
      ['ALL', 'ONBOARDING', 'ACTIVE', 'SUSPENDED', 'WITHDRAWN'] as const,
      'ALL',
    ),
    from: queryPastDate(),
    to: queryPastDate(),
    page: queryPage,
  });
  const search = useUrlSearch(filters.keyword, (keyword) =>
    updateFilters({ keyword, page: 1 }),
  );
  const [density, setDensity] = useState<TableDensity>('normal');
  const settings = useTableColumnSettings('owners', columns);
  const error =
    filters.from && filters.to && filters.from > filters.to
      ? '가입일 시작일은 종료일보다 늦을 수 없습니다.'
      : '';
  const params = new URLSearchParams({ page: String(filters.page - 1) });
  if (filters.keyword.trim()) params.set('keyword', filters.keyword.trim());
  if (filters.status !== 'ALL') params.set('status', filters.status);
  if (filters.from) params.set('joinedFrom', filters.from);
  if (filters.to) params.set('joinedTo', filters.to);
  const resource = useApiResource(getOwners, error ? null : params.toString());
  const pagination = {
    currentPage: filters.page,
    totalPages: Math.ceil((resource.data?.totalElements ?? 0) / 20),
    onPageChange: (page: number) => updateFilters({ page }),
  };
  return (
    <>
      <FilterBar
        className="mb-2 mt-3"
        columnSettings={settings}
        density={{ value: density, onValueChange: setDensity }}
        pagination={pagination}
      >
        <SearchField
          aria-label="점주 ID 또는 상호 검색"
          placeholder="점주 ID 또는 상호 검색"
          value={search.draftKeyword}
          onChange={(event) => search.setDraftKeyword(event.target.value)}
        />
        <SelectField
          aria-label="점주 상태"
          fitContent
          value={filters.status}
          options={[
            { label: '상태 전체', value: 'ALL' },
            ...Object.entries(statuses).map(([value, item]) => ({
              value,
              label: item.label,
            })),
          ]}
          onValueChange={(value) => {
            if (value === 'ALL' || value in statuses)
              updateFilters({
                status: value as typeof filters.status,
                page: 1,
              });
          }}
        />
        <AdminDateRangePicker
          ariaLabel="점주 가입일 범위"
          value={{ startDate: filters.from, endDate: filters.to }}
          onValueChange={(value) =>
            updateFilters({ from: value.startDate, to: value.endDate, page: 1 })
          }
        />
      </FilterBar>
      <DataTable
        aria-label="점주 목록"
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
                // 점주 API는 가입일 최신순으로 고정되어 정렬 방향만 표시한다.
                sortDirection={column.key === 'joinedAt' ? 'desc' : undefined}
                title={
                  column.key === 'joinedAt' ? '가입일 최신순 고정' : undefined
                }
              >
                {column.label}
              </TableHeaderCell>
            ))}
          </tr>
        </thead>
        <tbody>
          {resource.loading ? (
            <tr>
              <TableLoading colSpan={columns.length} />
            </tr>
          ) : error || resource.error ? (
            <tr>
              <TableError
                colSpan={columns.length}
                description={error || resource.error}
                onRetry={!error ? resource.refresh : undefined}
              />
            </tr>
          ) : !resource.data?.items.length ? (
            <tr>
              <TableEmpty colSpan={columns.length}>
                조회된 점주가 없습니다.
              </TableEmpty>
            </tr>
          ) : (
            resource.data.items.map((owner) => (
              <TableRow key={owner.ownerId}>
                <TableCell>{formatDateTime(owner.joinedAt)}</TableCell>
                <TableCell>{owner.ownerId}</TableCell>
                <TableCell>{owner.storeName ?? '—'}</TableCell>
                <TableCell>
                  <StatusBadge variant={statuses[owner.status].variant}>
                    {statuses[owner.status].label}
                  </StatusBadge>
                </TableCell>
                <TableCell>
                  <StatusBadge
                    variant={owner.storeRegistered ? 'success' : 'neutral'}
                  >
                    {owner.storeRegistered ? '등록 완료' : '등록 전'}
                  </StatusBadge>
                </TableCell>
                <TableCell>{owner.businessNo ?? '—'}</TableCell>
                <TableCell>{formatDateTime(owner.lastLoginAt)}</TableCell>
              </TableRow>
            ))
          )}
        </tbody>
      </DataTable>
      <PaginationSummary
        totalCount={resource.data?.totalElements ?? 0}
        pageSize={20}
      />
    </>
  );
};
