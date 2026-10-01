import { useEffect, useMemo, useState } from 'react';
import {
  DateRangePicker,
  type DateRangeValue,
  SearchField,
  SelectField,
  StatusBadge,
} from '@repo/ui';
import { ChevronRight, RotateCcw } from 'lucide-react';

import { AdminDrawer } from '@admin/components/AdminDrawer/AdminDrawer';
import { CampaignDetailContent } from '@admin/components/CampaignDetailContent/CampaignDetailContent';
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
import { Pagination } from '@admin/components/Pagination/Pagination';
import { TableDensityControl } from '@admin/components/TableDensityControl/TableDensityControl';
import {
  type Campaign,
  campaigns,
  campaignStatusMeta,
  formatPoints,
  getBudgetProgress,
} from '@admin/features/campaign/campaignData';

type CampaignSortKey =
  | 'id'
  | 'storeName'
  | 'status'
  | 'startDate'
  | 'dailyBudget'
  | 'cumulativeSpent'
  | 'validImpressions'
  | 'progress';
interface CampaignSort {
  key: CampaignSortKey;
  direction: TableSortDirection;
}

const statusOptions = [
  { label: '전체', value: 'ALL' },
  ...Object.entries(campaignStatusMeta).map(([value, meta]) => ({
    value,
    label: meta.label,
  })),
];
const columns: DataTableColumn[] = [9, 13, 9, 14, 9, 12, 9, 12, 13].map(
  (width) => ({ width: `${width}%` }),
);
const headers: { label: string; key: CampaignSortKey }[] = [
  { label: '캠페인 ID', key: 'id' },
  { label: '가게', key: 'storeName' },
  { label: '상태', key: 'status' },
  { label: '집행 기간', key: 'startDate' },
  { label: '하루 예산', key: 'dailyBudget' },
  { label: '당일 / 누적 소진', key: 'cumulativeSpent' },
  { label: '유효 노출', key: 'validImpressions' },
  { label: '소진 진행률', key: 'progress' },
];

export const CampaignManagementPage = () => {
  const [draftKeyword, setDraftKeyword] = useState('');
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState('ALL');
  // 닫힘 애니메이션 중에도 상세 내용이 유지되도록 선택 데이터와 표시 상태를 분리한다.
  const [detailOpen, setDetailOpen] = useState(false);
  const [range, setRange] = useState<DateRangeValue>({
    startDate: '',
    endDate: '',
  });
  const [density, setDensity] = useState<TableDensity>('normal');
  const [sort, setSort] = useState<CampaignSort | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(
    null,
  );

  useEffect(() => {
    // 연속 입력마다 목록을 갱신하지 않고 마지막 입력 후 300ms가 지나면 검색한다.
    const timer = window.setTimeout(() => {
      setKeyword(draftKeyword);
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [draftKeyword]);

  const filteredCampaigns = useMemo(() => {
    const query = keyword.trim().toLowerCase();
    const result = campaigns.filter(
      (campaign) =>
        (status === 'ALL' || campaign.status === status) &&
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
  }, [keyword, range, sort, status]);

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
    setDraftKeyword('');
    setKeyword('');
    setStatus('ALL');
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
          전체 캠페인의 집행 현황과 포스터 정보를 조회할 수 있습니다.
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
            <SelectField
              aria-label="캠페인 상태"
              fitContent
              options={statusOptions}
              onValueChange={(value) => {
                setStatus(value);
                setPage(1);
              }}
              value={status}
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
            <button
              aria-label="필터 초기화"
              className="flex size-10 cursor-pointer items-center justify-center text-action-primary focus-visible:outline-2 focus-visible:outline-action-primary"
              onClick={handleReset}
              type="button"
            >
              <RotateCcw className="size-4" />
            </button>
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
            <TableHeaderCell columnIndex={8}>노출 대상</TableHeaderCell>
          </tr>
        </thead>
        <tbody>
          {filteredCampaigns.length === 0 && (
            <tr>
              <TableEmpty colSpan={9}>조회된 캠페인이 없습니다</TableEmpty>
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
                  title={`${campaign.startDate} ~ ${campaign.endDate}`}
                >
                  {campaign.startDate} ~ {campaign.endDate}
                </TableCell>
                <TableCell title={formatPoints(campaign.dailyBudget)}>
                  {formatPoints(campaign.dailyBudget)}
                </TableCell>
                <TableCell
                  title={`${formatPoints(campaign.todaySpent)} / ${formatPoints(campaign.cumulativeSpent)}`}
                >
                  <span className="block">
                    {formatPoints(campaign.todaySpent)}
                  </span>
                  <span className="block text-text-secondary">
                    {formatPoints(campaign.cumulativeSpent)}
                  </span>
                </TableCell>
                <TableCell>
                  {campaign.validImpressions.toLocaleString('ko-KR')}회
                </TableCell>
                <TableCell>
                  <span>{progress.toFixed(1)}%</span>
                  <div
                    aria-label="예산 소진 진행률"
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
                  className="relative"
                  title={`${campaign.radius}m · ${campaign.gender} · ${campaign.ageGroups}`}
                >
                  <span className="block truncate pr-4">
                    {campaign.radius}m · {campaign.gender}
                  </span>
                  <span className="block truncate pr-4 text-text-secondary">
                    {campaign.ageGroups}
                  </span>
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
