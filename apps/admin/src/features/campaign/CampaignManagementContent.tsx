import { useMemo, useState } from 'react';
import {
  DateRangePicker,
  type DateRangeValue,
  MultiSelectField,
  SearchField,
  StatusBadge,
} from '@repo/ui';
import { formatDateRange, formatPoints } from '@repo/utils';
import { ChevronRight } from 'lucide-react';

import { campaigns } from '@admin/api/mocks/campaigns';
import { AdminDrawer } from '@admin/components/AdminDrawer/AdminDrawer';
import {
  DataTable,
  type DataTableColumn,
  TableCell,
  type TableDensity,
  TableEmpty,
  TableHeaderCell,
  TableRow,
  type TableSortDirection,
} from '@admin/components/DataTable/DataTable';
import { FilterBar } from '@admin/components/FilterBar/FilterBar';
import { FilterResetButton } from '@admin/components/FilterResetButton/FilterResetButton';
import { Pagination } from '@admin/components/Pagination/Pagination';
import { TableDensityControl } from '@admin/components/TableDensityControl/TableDensityControl';
import { useDebouncedSearch } from '@admin/hooks/useDebouncedSearch';

import { CampaignDetailContent } from './CampaignDetailContent';
import type { Campaign, CampaignStatus } from './campaignTypes';
import { campaignStatusMeta, getBudgetProgress } from './campaignUtils';

type CampaignSortKey =
  | 'id'
  | 'storeName'
  | 'status'
  | 'startDate'
  | 'todaySpent'
  | 'cumulativeSpent'
  | 'progress';
interface CampaignSort {
  key: CampaignSortKey;
  direction: TableSortDirection;
}

const statusOptions = Object.entries(campaignStatusMeta).map(
  ([value, meta]) => ({
    value,
    label: meta.label,
  }),
);
const initialStatuses: CampaignStatus[] = ['SCHEDULED', 'ACTIVE'];
// 브라우저의 시간대와 무관하게 서비스 운영일(한국 시간)을 기본 집행 기간으로 사용한다.
const getTodayRange = (): DateRangeValue => {
  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
  return { startDate: today, endDate: today };
};
const columns: DataTableColumn[] = [9, 16, 11, 16, 10, 18, 20].map((width) => ({
  width: `${width}%`,
}));
const headers: { label: string; key: CampaignSortKey }[] = [
  { label: '캠페인 ID', key: 'id' },
  { label: '가게', key: 'storeName' },
  { label: '상태', key: 'status' },
  { label: '오늘 사용 / 하루 한도', key: 'todaySpent' },
  { label: '총 사용', key: 'cumulativeSpent' },
  { label: '예산 사용률', key: 'progress' },
  { label: '집행 기간', key: 'startDate' },
];

export const CampaignManagementContent = () => {
  const [statuses, setStatuses] = useState<CampaignStatus[]>(initialStatuses);
  // 닫힘 애니메이션 중에도 상세 내용이 유지되도록 선택 데이터와 표시 상태를 분리한다.
  const [detailOpen, setDetailOpen] = useState(false);
  const [range, setRange] = useState<DateRangeValue>(getTodayRange);
  const [density, setDensity] = useState<TableDensity>('normal');
  const [sort, setSort] = useState<CampaignSort | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(
    null,
  );
  const { draftKeyword, keyword, setDraftKeyword, resetSearch } =
    useDebouncedSearch({ onCommit: () => setPage(1) });

  const filteredCampaigns = useMemo(() => {
    const query = keyword.trim().toLowerCase();
    const result = campaigns.filter(
      (campaign) =>
        statuses.includes(campaign.status) &&
        (!query ||
          [campaign.id, campaign.storeName, campaign.posterTitle].some(
            (value) => value.toLowerCase().includes(query),
          )) &&
        // 선택 기간과 집행 기간이 하루라도 겹치는 캠페인을 조회한다.
        (!range.startDate || campaign.endDate >= range.startDate) &&
        (!range.endDate || campaign.startDate <= range.endDate),
    );
    if (!sort) return result;

    return result.sort((first, second) => {
      const a =
        sort.key === 'progress' ? getBudgetProgress(first) : first[sort.key];
      const b =
        sort.key === 'progress' ? getBudgetProgress(second) : second[sort.key];
      const comparison =
        typeof a === 'number' && typeof b === 'number'
          ? a - b
          : String(a).localeCompare(String(b), 'ko');
      return sort.direction === 'asc' ? comparison : -comparison;
    });
  }, [keyword, range, sort, statuses]);

  const visibleCampaigns = filteredCampaigns.slice(
    (page - 1) * pageSize,
    page * pageSize,
  );

  const handleSort = (key: CampaignSortKey) => {
    setPage(1);
    setSort((current) =>
      !current || current.key !== key
        ? { key, direction: 'desc' }
        : current.direction === 'desc'
          ? { key, direction: 'asc' }
          : null,
    );
  };

  const handleReset = () => {
    resetSearch();
    // 첫 진입은 오늘의 진행 예정/집행 중 항목이며, 초기화는 조건 없는 전체 조회다.
    setStatuses(Object.keys(campaignStatusMeta) as CampaignStatus[]);
    setRange({ startDate: '', endDate: '' });
    setSort(null);
    setPage(1);
  };

  return (
    <section className="flex flex-col">
      <header className="mb-4">
        <h2 className="text-display-web font-semibold text-text-primary">
          캠페인 관리
        </h2>
        <p className="mt-2 text-body-sm-web text-text-secondary">
          오늘 사용은 하루 한도와 함께 표시합니다. 총 사용은 캠페인 시작 이후
          사용한 포인트 합계이며, 선택한 조회 기간의 합계가 아닙니다.
        </p>
      </header>
      <FilterBar className="mb-2">
        <div className="flex w-full flex-wrap items-center justify-between gap-3">
          <TableDensityControl onValueChange={setDensity} value={density} />
          <div className="ml-auto flex flex-wrap items-center justify-end gap-3">
            <SearchField
              onChange={(event) => setDraftKeyword(event.target.value)}
              value={draftKeyword}
            />
            <MultiSelectField
              aria-label="캠페인 상태"
              fitContent
              options={statusOptions}
              onValueChange={(value) => {
                setStatuses(value as CampaignStatus[]);
                setPage(1);
              }}
              value={statuses}
            />
            <div className="w-[216px]">
              <DateRangePicker
                ariaLabel="집행 기간 범위"
                placeholder="집행 기간 선택"
                value={range}
                onValueChange={(value) => {
                  setRange(value);
                  setPage(1);
                }}
              />
            </div>
            <FilterResetButton onClick={handleReset} />
          </div>
        </div>
      </FilterBar>
      <DataTable
        className="table-fixed"
        columns={columns}
        density={density}
        resizableColumns
      >
        <thead>
          <tr>
            {headers.map((header, index) => (
              <TableHeaderCell
                columnIndex={index}
                key={header.key}
                onSortChange={() => handleSort(header.key)}
                sortDirection={
                  sort?.key === header.key ? sort.direction : undefined
                }
              >
                {header.label}
              </TableHeaderCell>
            ))}
          </tr>
        </thead>
        <tbody>
          {filteredCampaigns.length === 0 && (
            <tr>
              <TableEmpty colSpan={headers.length}>
                조회된 캠페인이 없습니다
              </TableEmpty>
            </tr>
          )}
          {visibleCampaigns.map((campaign) => {
            const progress = getBudgetProgress(campaign);
            return (
              <TableRow
                className="cursor-pointer focus-visible:outline-2 focus-visible:outline-action-primary"
                key={campaign.id}
                onClick={() => {
                  setSelectedCampaign(campaign);
                  setDetailOpen(true);
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    setSelectedCampaign(campaign);
                    setDetailOpen(true);
                  }
                }}
                tabIndex={0}
                aria-label={`${campaign.id} 상세 보기`}
              >
                <TableCell>{campaign.id}</TableCell>
                <TableCell title={campaign.storeName}>
                  {campaign.storeName}
                </TableCell>
                <TableCell>
                  <StatusBadge
                    variant={campaignStatusMeta[campaign.status].variant}
                  >
                    {campaignStatusMeta[campaign.status].label}
                  </StatusBadge>
                </TableCell>
                <TableCell
                  title={`오늘 사용 ${formatPoints(campaign.todaySpent)} / 하루 한도 ${formatPoints(campaign.dailyBudget)}`}
                >
                  <span>{formatPoints(campaign.todaySpent)}</span>
                  <span className="text-text-secondary">
                    {' '}
                    / {formatPoints(campaign.dailyBudget)}
                  </span>
                </TableCell>
                <TableCell
                  title={`캠페인 시작 이후 사용한 총 포인트: ${formatPoints(campaign.cumulativeSpent)}`}
                >
                  {formatPoints(campaign.cumulativeSpent)}
                </TableCell>
                <TableCell title="누적 사용 포인트 ÷ 누적 목표 포인트">
                  <span>{progress.toFixed(1)}%</span>
                  <div
                    aria-label="예산 사용률"
                    className="mt-1 h-1 overflow-hidden rounded-full bg-surface-subtle"
                    role="meter"
                    aria-valuenow={progress}
                    aria-valuemin={0}
                    aria-valuemax={Math.max(100, progress)}
                  >
                    <div
                      className="h-full rounded-full bg-action-primary"
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>
                </TableCell>
                <TableCell
                  className="relative !pr-10"
                  title={formatDateRange(campaign.startDate, campaign.endDate)}
                >
                  {formatDateRange(campaign.startDate, campaign.endDate)}
                  <ChevronRight
                    aria-hidden="true"
                    className="pointer-events-none absolute right-2 top-1/2 size-4 -translate-y-1/2 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100"
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </tbody>
      </DataTable>
      <div className="mt-3">
        <Pagination
          currentPage={page}
          onPageChange={setPage}
          onPageSizeChange={(value) => {
            setPageSize(value);
            setPage(1);
          }}
          pageSize={pageSize}
          pageSizeOptions={[5, 10, 20, 50]}
          totalCount={filteredCampaigns.length}
          totalPages={Math.ceil(filteredCampaigns.length / pageSize)}
        />
      </div>
      <AdminDrawer
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        title="캠페인 상세"
        resizable
      >
        <CampaignDetailContent campaign={selectedCampaign} />
      </AdminDrawer>
    </section>
  );
};
