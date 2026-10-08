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

import { campaigns, getMockCampaignReports } from '@admin/api/mocks/campaigns';
import {
  DataTable,
  type DataTableColumn,
  TableCell,
  type TableDensity,
  TableEmpty,
  TableHeaderCell,
  TableRow,
  type TableSortDirection,
} from '@admin/components/DataTable';
import { FilterBar } from '@admin/components/FilterBar/FilterBar';
import { PaginationSummary } from '@admin/components/Pagination/PaginationSummary';
import { useDebouncedSearch } from '@admin/hooks/useDebouncedSearch';

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
const columns: DataTableColumn[] = [10, 10, 13, 9, 15, 11, 11, 10, 11].map(
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
  { label: '하루 예산', key: 'dailyBudget' },
  { label: '누적 소진 포인트', key: 'cumulativeSpent' },
  { label: '누적 유효 노출', key: 'validImpressions' },
  { label: '집행 기간', key: 'startDate' },
];

export const CampaignManagementContent = () => {
  const [statuses, setStatuses] = useState<CampaignStatus[]>(initialStatuses);
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
          노출은 전일 확정 기준입니다.
        </p>
      </header>
      <FilterBar
        tableKey="campaigns"
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
        personalizationKey="campaigns"
        columns={columns.map((column, index) => ({
          ...column,
          key: headers[index].key,
          label: headers[index].label,
        }))}
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
