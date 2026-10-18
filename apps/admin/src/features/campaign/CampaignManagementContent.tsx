import { useMemo, useState } from 'react';
import {
  DateRangePicker,
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

import { campaigns, getMockCampaignReports } from '@admin/api/mocks/campaigns';
import {
  queryChoice,
  queryChoices,
  queryDate,
  queryPage,
  querySize,
  queryText,
} from '@admin/hooks/urlQuery';
import { useUrlFilters } from '@admin/hooks/useUrlFilters';
import { useUrlSearch } from '@admin/hooks/useUrlSearch';
import {
  DataTable,
  type DataTableColumn,
  TableCell,
  type TableDensity,
  TableEmpty,
  TableHeaderCell,
  TableRow,
  type TableSortDirection,
  useTableColumnSettings,
} from '@admin/ui/DataTable';
import { FilterBar } from '@admin/ui/FilterBar/FilterBar';
import { PaginationSummary } from '@admin/ui/Pagination/PaginationSummary';

import type { Campaign, CampaignReport, CampaignStatus } from './campaignTypes';
import { campaignStatusMeta } from './campaignUtils';

type CampaignSortKey =
  | 'id'
  | 'ownerId'
  | 'registeredAt'
  | 'validImpressions'
  | 'storeName'
  | 'status'
  | 'startDate'
  | 'dailyBudget'
  | 'cumulativeSpent';
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
const headers: { label: string; key: CampaignSortKey }[] = [
  { label: '캠페인 ID', key: 'id' },
  { label: '점주 ID', key: 'ownerId' },
  { label: '가게', key: 'storeName' },
  { label: '상태', key: 'status' },
  { label: '등록 시각', key: 'registeredAt' },
  { label: '하루 예산', key: 'dailyBudget' },
  { label: '누적 소진 포인트', key: 'cumulativeSpent' },
  { label: '누적 유효 노출', key: 'validImpressions' },
  { label: '집행 기간', key: 'startDate' },
];
const columnWidths = [10, 10, 13, 9, 15, 11, 11, 10, 11];
// 설정과 테이블에 동일한 식별자·이름을 전달해야 열 숨김과 순서 변경이 일치한다.
const columns: DataTableColumn[] = headers.map((header, index) => ({
  ...header,
  minWidth: 120,
  width: `${columnWidths[index]}%`,
}));

const campaignQuery = {
  keyword: queryText(),
  statuses: queryChoices(initialStatuses),
  from: queryDate(),
  to: queryDate(),
  page: queryPage,
  size: querySize,
  sortBy: queryChoice(
    [
      'id',
      'ownerId',
      'registeredAt',
      'validImpressions',
      'storeName',
      'status',
      'startDate',
      'dailyBudget',
      'cumulativeSpent',
    ] as const,
    'registeredAt',
  ),
  sortDir: queryChoice(['asc', 'desc'] as const, 'desc'),
};
export const CampaignManagementContent = () => {
  const columnSettings = useTableColumnSettings('campaigns', columns);
  const { filters, updateFilters } = useUrlFilters('campaigns.', campaignQuery);
  const { page, size: pageSize } = filters;
  const statuses = useMemo(
    () =>
      filters.statuses ? (filters.statuses.split(',') as CampaignStatus[]) : [],
    [filters.statuses],
  );
  const range = useMemo(
    () => ({ startDate: filters.from, endDate: filters.to }),
    [filters.from, filters.to],
  );
  const sort = useMemo<CampaignSort>(
    () => ({ key: filters.sortBy, direction: filters.sortDir }),
    [filters.sortBy, filters.sortDir],
  );
  const [density, setDensity] = useState<TableDensity>('normal');
  const [reports] = useState(getMockCampaignReports);
  const { draftKeyword, keyword, setDraftKeyword } = useUrlSearch(
    filters.keyword,
    (keyword) => updateFilters({ keyword, page: 1 }),
  );

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
          [campaign.id, campaign.ownerId, campaign.storeName].some((value) =>
            value.toLowerCase().includes(query),
          )) &&
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
    updateFilters({
      page: 1,
      sortBy:
        sort.key !== key
          ? key
          : sort.direction === 'desc'
            ? key
            : 'registeredAt',
      sortDir: sort.key === key && sort.direction === 'desc' ? 'asc' : 'desc',
    });
  };

  const pagination = {
    currentPage: page,
    onPageChange: (page: number) => updateFilters({ page }),
    onPageSizeChange: (value: number) => {
      // 개수를 바꾸면 기존 페이지가 범위를 벗어날 수 있어 첫 페이지로 돌아간다.
      updateFilters({ size: value, page: 1 });
    },
    pageSize,
    totalCount: filteredCampaigns.length,
    totalPages: Math.ceil(filteredCampaigns.length / pageSize),
  };

  return (
    <section className="flex flex-col">
      <header className="mb-4">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-display-web font-semibold text-text-primary">
            캠페인 관리
          </h2>
          <StatusBadge variant="neutral">예시 데이터</StatusBadge>
        </div>
        <p className="mt-2 text-body-sm-web text-text-secondary">
          전체 캠페인을 최신 등록순으로 조회합니다. 누적 소진 포인트와 유효
          노출은 전일 확정 기준입니다.
        </p>
      </header>
      <FilterBar
        columnSettings={columnSettings}
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
            updateFilters({ statuses: value.join(','), page: 1 });
          }}
          value={statuses}
        />
        <DateRangePicker
          ariaLabel="집행 기간 범위"
          placeholder="집행 기간 선택"
          value={range}
          onValueChange={(value) => {
            updateFilters({
              from: value.startDate,
              to: value.endDate,
              page: 1,
            });
          }}
        />
      </FilterBar>
      <DataTable
        className="table-fixed"
        columnSettings={columnSettings}
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
          {visibleCampaigns.map((campaign) => (
            <TableRow key={campaign.id}>
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
              <TableCell>{formatPoints(campaign.dailyBudget)}</TableCell>
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
              <TableCell
                title={formatDateRange(campaign.startDate, campaign.endDate)}
              >
                {formatDateRange(campaign.startDate, campaign.endDate)}
              </TableCell>
            </TableRow>
          ))}
        </tbody>
      </DataTable>
      <PaginationSummary {...pagination} />
    </section>
  );
};
