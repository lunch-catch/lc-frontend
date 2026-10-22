import { useState } from 'react';
import { Button, SearchField, SelectField, StatusBadge } from '@repo/ui';
import { formatDateTime, formatNumber, formatPoints } from '@repo/utils';

import { campaignStatuses } from '@admin/api/campaigns';
import { queryChoice, querySize, queryText } from '@admin/hooks/urlQuery';
import { useUrlFilters } from '@admin/hooks/useUrlFilters';
import { useUrlSearch } from '@admin/hooks/useUrlSearch';
import { AdminDrawer } from '@admin/ui/AdminDrawer/AdminDrawer';
import {
  DataTable,
  type DataTableColumn,
  TableCell,
  type TableDensity,
  TableEmpty,
  TableError,
  TableHeaderCell,
  TableLoading,
  TableRow,
  useTableColumnSettings,
} from '@admin/ui/DataTable';
import { FilterBar } from '@admin/ui/FilterBar/FilterBar';
import { LoadMoreButton } from '@admin/ui/Pagination/LoadMoreButton';

import { CampaignDetails } from './CampaignDetails';
import {
  campaignStatusMeta,
  getCampaignDiscount,
  getCampaignPeriod,
} from './campaignUtils';
import { useCampaignReports } from './useCampaignReports';
import { useCampaigns } from './useCampaigns';

const columns: DataTableColumn[] = [
  { key: 'campaignId', label: '캠페인 ID', width: '8%', minWidth: 100 },
  { key: 'storeId', label: '가게 ID', width: '7%', minWidth: 90 },
  { key: 'storeName', label: '가게명', width: '16%', minWidth: 140 },
  { key: 'status', label: '상태', width: '8%', minWidth: 110 },
  { key: 'createdAt', label: '등록 시각', width: '13%', minWidth: 165 },
  { key: 'discount', label: '할인', width: '12%', minWidth: 150 },
  {
    key: 'dailyBudget',
    label: '하루 예산',
    width: '8%',
    minWidth: 110,
    align: 'right',
  },
  { key: 'period', label: '집행 기간', width: '12%', minWidth: 175 },
  {
    key: 'spentAmount',
    label: '소진 포인트',
    width: '8%',
    minWidth: 120,
    align: 'right',
  },
  {
    key: 'validImpressionCount',
    label: '유효 노출',
    width: '8%',
    minWidth: 110,
    align: 'right',
  },
];
const campaignQuery = {
  storeId: queryText(),
  status: queryChoice(['ALL', ...campaignStatuses] as const, 'ALL'),
  size: querySize,
  detail: queryText(),
};
const statusOptions = [
  { value: 'ALL', label: '상태 전체' },
  ...campaignStatuses.map((status) => ({
    value: status,
    label: campaignStatusMeta[status].label,
  })),
];

export const CampaignManagementContent = () => {
  // 기존 가게 우선 열 설정이 새 캠페인 ID 우선 구성을 덮어쓰지 않도록 구분한다.
  const columnSettings = useTableColumnSettings('campaigns-id-first', columns);
  const { filters, updateFilters } = useUrlFilters('campaigns.', campaignQuery);
  const [density, setDensity] = useState<TableDensity>('normal');
  const search = useUrlSearch(filters.storeId, (storeId) =>
    updateFilters({ storeId }),
  );
  const storeId = search.keyword.trim();
  const validationError =
    storeId &&
    (!/^[1-9]\d*$/.test(storeId) || !Number.isSafeInteger(Number(storeId)))
      ? '가게 ID는 양의 정수로 입력해 주세요.'
      : '';
  // 목록 API가 지원하는 가게 ID·단일 상태·페이지 크기만 전송한다.
  const params = new URLSearchParams({ pageSize: String(filters.size) });
  if (storeId) params.set('storeId', storeId);
  if (filters.status !== 'ALL') params.set('status', filters.status);
  const resource = useCampaigns(validationError ? null : params.toString());
  const items = resource.data?.items ?? [];
  const performance = useCampaignReports(
    items.map((item) => item.campaignId),
    params.toString(),
  );
  const error = validationError || resource.error;
  const openDetail = (id: number) => updateFilters({ detail: String(id) });

  return (
    <section className="flex flex-col">
      <header className="mb-4">
        <h2 className="text-display-web font-semibold text-text-primary">
          캠페인 관리
        </h2>
        <p className="mt-2 text-body-sm-web text-text-secondary">
          전체 캠페인을 최신 등록순으로 조회합니다. 실적은 전일까지 집계된 전체
          기간 기준입니다.
        </p>
      </header>
      <FilterBar
        columnSettings={columnSettings}
        className="mb-2"
        density={{ value: density, onValueChange: setDensity }}
      >
        <SearchField
          aria-label="가게 ID 검색"
          placeholder="가게 ID 검색"
          value={search.draftKeyword}
          onChange={(event) => search.setDraftKeyword(event.target.value)}
        />
        <SelectField
          fitContent
          aria-label="캠페인 상태"
          options={statusOptions}
          value={filters.status}
          onValueChange={(status) =>
            updateFilters({ status: status as typeof filters.status })
          }
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
            {columns.map((column, index) => (
              <TableHeaderCell
                key={column.key}
                columnIndex={index}
                sortDirection={column.key === 'campaignId' ? 'desc' : undefined}
                title={
                  column.key === 'campaignId'
                    ? '캠페인 ID 내림차순 고정'
                    : undefined
                }
              >
                {column.label}
              </TableHeaderCell>
            ))}
          </tr>
        </thead>
        <tbody>
          {resource.loading && !resource.data ? (
            <tr>
              <TableLoading colSpan={columns.length} />
            </tr>
          ) : error && !resource.data ? (
            <tr>
              <TableError
                colSpan={columns.length}
                description={error}
                onRetry={!validationError ? resource.refresh : undefined}
              />
            </tr>
          ) : items.length === 0 ? (
            <tr>
              <TableEmpty colSpan={columns.length}>
                조회된 캠페인이 없습니다
              </TableEmpty>
            </tr>
          ) : (
            items.map((campaign) => {
              const report = performance.reports.get(campaign.campaignId);
              const unavailable = performance.error ? '조회 실패' : '조회 중';
              return (
                <TableRow
                  key={campaign.campaignId}
                  tabIndex={0}
                  showDetailArrow
                  className="cursor-pointer focus-visible:outline-2 focus-visible:outline-action-primary"
                  onClick={() => openDetail(campaign.campaignId)}
                  onKeyDown={(event) => {
                    if (
                      event.target === event.currentTarget &&
                      (event.key === 'Enter' || event.key === ' ')
                    ) {
                      event.preventDefault();
                      openDetail(campaign.campaignId);
                    }
                  }}
                >
                  <TableCell>
                    <button
                      type="button"
                      className="text-text-primary hover:underline focus-visible:outline-2 focus-visible:outline-action-primary"
                      aria-label={`캠페인 ${campaign.campaignId} 상세 보기`}
                      onClick={(event) => {
                        event.stopPropagation();
                        openDetail(campaign.campaignId);
                      }}
                    >
                      {campaign.campaignId}
                    </button>
                  </TableCell>
                  <TableCell>{campaign.storeId}</TableCell>
                  <TableCell title={campaign.storeName ?? undefined}>
                    {campaign.storeName ?? '미등록 가게'}
                  </TableCell>
                  <TableCell>
                    <StatusBadge
                      variant={campaignStatusMeta[campaign.status].variant}
                    >
                      {campaignStatusMeta[campaign.status].label}
                    </StatusBadge>
                  </TableCell>
                  <TableCell>{formatDateTime(campaign.createdAt)}</TableCell>
                  <TableCell>{getCampaignDiscount(campaign)}</TableCell>
                  <TableCell>
                    {campaign.dailyBudget === null
                      ? '미설정'
                      : formatPoints(campaign.dailyBudget)}
                  </TableCell>
                  <TableCell>{getCampaignPeriod(campaign)}</TableCell>
                  <TableCell>
                    {report ? formatPoints(report.spentAmount) : unavailable}
                  </TableCell>
                  <TableCell>
                    {report
                      ? `${formatNumber(report.validImpressionCount)}회`
                      : unavailable}
                  </TableCell>
                </TableRow>
              );
            })
          )}
          {resource.data && resource.error && (
            <tr>
              <TableError
                colSpan={columns.length}
                description={resource.error}
                onRetry={resource.loadMore}
              />
            </tr>
          )}
        </tbody>
      </DataTable>
      {performance.error && (
        <div className="mt-3 flex items-center justify-between gap-3">
          <p role="alert" className="text-body-sm-web text-status-danger-fg">
            실적 조회 실패: {performance.error}
          </p>
          <Button variant="neutral" onClick={performance.refresh}>
            실적 다시 조회
          </Button>
        </div>
      )}
      <LoadMoreButton
        hasMore={Boolean(resource.data?.nextPageToken && !resource.error)}
        loading={resource.loading}
        onClick={resource.loadMore}
        controls={
          <>
            {/* 커서 응답에는 전체 건수가 없으므로 현재까지 불러온 개수만 표시한다. */}
            {resource.data && (
              <span className="text-caption-web text-text-secondary">
                불러온 캠페인 {items.length}건
              </span>
            )}
            <SelectField
              aria-label="한 번에 불러올 항목 수"
              fitContent
              menuPlacement="top"
              size="compact"
              value={String(filters.size)}
              options={[5, 10, 20, 50].map((size) => ({
                label: `${size}개씩 불러오기`,
                value: String(size),
              }))}
              onValueChange={(value) => updateFilters({ size: Number(value) })}
            />
          </>
        }
      />
      <AdminDrawer
        open={Boolean(filters.detail)}
        onClose={() => updateFilters({ detail: '' })}
        title="캠페인 상세"
        resizable
      >
        {filters.detail && <CampaignDetails campaignId={filters.detail} />}
      </AdminDrawer>
    </section>
  );
};
