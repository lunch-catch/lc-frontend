import { useMemo, useState } from 'react';
import {
  DateRangePicker,
  type DateRangeValue,
  MultiSelectField,
  SearchField,
  StatusBadge,
} from '@repo/ui';
import {
  formatDateRange,
  formatDateTime,
  formatNumber,
  formatPoints,
} from '@repo/utils';
import { ChevronRight } from 'lucide-react';

import { campaigns, getMockCampaignReports } from '@admin/api/mocks/campaigns';
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
import { PaginationSummary } from '@admin/components/Pagination/PaginationSummary';
import { useDebouncedSearch } from '@admin/hooks/useDebouncedSearch';

import { CampaignDetailContent } from './CampaignDetailContent';
import type { Campaign, CampaignReport, CampaignStatus } from './campaignTypes';
import { campaignStatusMeta, getBudgetProgress } from './campaignUtils';

type CampaignSortKey =
  | 'id'
  | 'ownerId'
  | 'registeredAt'
  | 'validImpressions'
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

interface CampaignRegistration extends Campaign {
  report?: CampaignReport;
}

const getCampaignSortValue = (
  campaign: CampaignRegistration,
  key: CampaignSortKey,
) => {
  if (key === 'progress') return getBudgetProgress(campaign);
  if (key === 'cumulativeSpent') return campaign.report?.spentPoints ?? null;
  if (key === 'validImpressions')
    return campaign.report?.validImpressions ?? null;
  return campaign[key];
};

const statusOptions = Object.entries(campaignStatusMeta).map(
  ([value, meta]) => ({
    value,
    label: meta.label,
  }),
);
const initialStatuses: CampaignStatus[] = [
  'SCHEDULED',
  'ACTIVE',
  'PAUSED',
  'ENDED',
];
const columns: DataTableColumn[] = [9, 9, 12, 8, 14, 12, 9, 9, 8, 10].map(
  (width) => ({
    minWidth: 120,
    width: `${width}%`,
  }),
);
const headers: { label: string; key: CampaignSortKey }[] = [
  { label: '캠페인 ID', key: 'id' },
  { label: '점주 ID', key: 'ownerId' },
  { label: '가게', key: 'storeName' },
  { label: '상태', key: 'status' },
  { label: '등록 시각', key: 'registeredAt' },
  { label: '오늘 사용 / 하루 한도', key: 'todaySpent' },
  { label: '누적 소진 포인트', key: 'cumulativeSpent' },
  { label: '누적 유효 노출', key: 'validImpressions' },
  { label: '예산 사용률', key: 'progress' },
  { label: '집행 기간', key: 'startDate' },
];

export const CampaignManagementContent = () => {
  const [statuses, setStatuses] = useState<CampaignStatus[]>(initialStatuses);
  // 닫힘 애니메이션 중에도 상세 내용이 유지되도록 선택 데이터와 표시 상태를 분리한다.
  const [detailOpen, setDetailOpen] = useState(false);
  const [range, setRange] = useState<DateRangeValue>({
    startDate: '',
    endDate: '',
  });
  const [density, setDensity] = useState<TableDensity>('normal');
  const [sort, setSort] = useState<CampaignSort>({
    key: 'registeredAt',
    direction: 'desc',
  });
  const [reports] = useState(getMockCampaignReports);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(
    null,
  );
  const { draftKeyword, keyword, setDraftKeyword } = useDebouncedSearch({
    onCommit: () => setPage(1),
  });

  const filteredCampaigns = useMemo(() => {
    // 목록과 분석 리포트를 ID로 합치며, 누락된 집계를 0으로 확정하지 않는다.
    const reportMap = new Map(
      reports.map((report) => [report.campaignId, report]),
    );
    const registrationCampaigns = campaigns.map((campaign) => ({
      ...campaign,
      report: reportMap.get(campaign.id),
    }));
    const query = keyword.trim().toLowerCase();
    const result = registrationCampaigns.filter(
      (campaign) =>
        statuses.includes(campaign.status) &&
        (!query ||
          [
            campaign.id,
            campaign.ownerId,
            campaign.storeName,
            campaign.posterTitle,
          ].some((value) => value.toLowerCase().includes(query))) &&
        // 선택 기간과 집행 기간이 하루라도 겹치는 캠페인을 조회한다.
        (!range.startDate || campaign.endDate >= range.startDate) &&
        (!range.endDate || campaign.startDate <= range.endDate),
    );
    return result.sort((first, second) => {
      const a = getCampaignSortValue(first, sort.key);
      const b = getCampaignSortValue(second, sort.key);
      // 리포트가 없는 항목은 방향과 관계없이 확정 값 뒤에 둔다.
      if (a === null || b === null) return a === b ? 0 : a === null ? 1 : -1;
      const comparison =
        typeof a === 'number' && typeof b === 'number'
          ? a - b
          : String(a).localeCompare(String(b), 'ko');
      return sort.direction === 'asc' ? comparison : -comparison;
    });
  }, [keyword, range, sort, statuses, reports]);

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
          : { key: 'registeredAt', direction: 'desc' },
    );
  };

  const pagination = {
    currentPage: page,
    onPageChange: setPage,
    onPageSizeChange: (value: number) => {
      // 개수를 바꾸면 기존 페이지가 범위를 벗어날 수 있어 첫 페이지로 돌아간다.
      setPageSize(value);
      setPage(1);
    },
    pageSize,
    totalCount: filteredCampaigns.length,
    totalPages: Math.ceil(filteredCampaigns.length / pageSize),
  };

  return (
    <section className="flex flex-col">
      <header className="mb-4">
        <h2 className="text-display-web font-semibold text-text-primary">
          캠페인 관리
        </h2>
        <p className="mt-2 text-body-sm-web text-text-secondary">
          전체 캠페인을 최신 등록순으로 조회합니다. 누적 소진 포인트와 유효
          노출은 전일 확정 기준이며, 오늘 사용은 하루 한도와 함께 표시합니다.
        </p>
      </header>
      <FilterBar
        className="mb-2"
        density={{ value: density, onValueChange: setDensity }}
        pagination={pagination}
      >
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
                <TableCell>{campaign.ownerId}</TableCell>
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
                <TableCell>{formatDateTime(campaign.registeredAt)}</TableCell>
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
                  title={
                    campaign.report
                      ? `${campaign.report.confirmedThrough} 확정 기준`
                      : '리포트 없음'
                  }
                >
                  {campaign.report
                    ? formatPoints(campaign.report.spentPoints)
                    : '-'}
                </TableCell>
                <TableCell
                  title={
                    campaign.report
                      ? `${campaign.report.confirmedThrough} 확정 기준`
                      : '리포트 없음'
                  }
                >
                  {campaign.report
                    ? `${formatNumber(campaign.report.validImpressions)}회`
                    : '-'}
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
      <PaginationSummary {...pagination} />

      <AdminDrawer
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        title="캠페인 상세"
        resizable
      >
        <CampaignDetailContent
          campaign={selectedCampaign}
          report={reports.find(
            (report) => report.campaignId === selectedCampaign?.id,
          )}
        />
      </AdminDrawer>
    </section>
  );
};
