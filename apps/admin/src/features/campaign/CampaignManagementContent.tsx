import { useState } from 'react';
import { Button, SearchField, SelectField, StatusBadge } from '@repo/ui';
import { formatDateTime, formatPoints } from '@repo/utils';

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

import { CampaignDetails } from './CampaignDetails';
import {
  campaignStatusMeta,
  getCampaignDiscount,
  getCampaignPeriod,
} from './campaignUtils';
import { useCampaigns } from './useCampaigns';

const columns: DataTableColumn[] = [
  { key: 'campaignId', label: '캠페인 ID', width: '8%', minWidth: 100 },
  { key: 'ownerId', label: '점주 ID', width: '8%', minWidth: 90 },
  { key: 'storeId', label: '가게 ID', width: '8%', minWidth: 90 },
  { key: 'storeName', label: '가게', width: '16%', minWidth: 140 },
  { key: 'status', label: '상태', width: '10%', minWidth: 110 },
  { key: 'createdAt', label: '등록 시각', width: '16%', minWidth: 165 },
  { key: 'discount', label: '할인', width: '12%', minWidth: 150 },
  {
    key: 'dailyBudget',
    label: '하루 예산',
    width: '10%',
    minWidth: 110,
    align: 'right',
  },
  { key: 'period', label: '집행 기간', width: '12%', minWidth: 175 },
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
  const columnSettings = useTableColumnSettings('campaigns', columns);
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
  const error = validationError || resource.error;
  const openDetail = (id: number) => updateFilters({ detail: String(id) });

  return (
    <section className="flex flex-col">
      <header className="mb-4">
        <h2 className="text-display-web font-semibold text-text-primary">
          캠페인 관리
        </h2>
        <p className="mt-2 text-body-sm-web text-text-secondary">
          전체 캠페인을 최신 등록순으로 조회합니다.
        </p>
      </header>
      <FilterBar
        columnSettings={columnSettings}
        className="mb-2"
        density={{ value: density, onValueChange: setDensity }}
      >
        <SearchField
          aria-label="가게 ID 검색"
          placeholder="가게 ID"
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
              <TableHeaderCell key={column.key} columnIndex={index}>
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
              <TableError colSpan={columns.length} description={error} />
            </tr>
          ) : items.length === 0 ? (
            <tr>
              <TableEmpty colSpan={columns.length}>
                조회된 캠페인이 없습니다
              </TableEmpty>
            </tr>
          ) : (
            items.map((campaign) => (
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
                    className="text-action-primary hover:underline focus-visible:outline-2 focus-visible:outline-action-primary"
                    aria-label={`캠페인 ${campaign.campaignId} 상세 보기`}
                    onClick={(event) => {
                      event.stopPropagation();
                      openDetail(campaign.campaignId);
                    }}
                  >
                    {campaign.campaignId}
                  </button>
                </TableCell>
                <TableCell>{campaign.ownerId}</TableCell>
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
              </TableRow>
            ))
          )}
        </tbody>
      </DataTable>
      {resource.error && resource.data && (
        <p role="alert" className="mt-3 text-body-sm-web text-status-danger-fg">
          {resource.error}
        </p>
      )}
      <div className="relative mt-3 flex flex-wrap items-center justify-end gap-3 [&:has([aria-expanded=true])]:z-30">
        {/* 커서 응답에는 전체 건수가 없으므로 현재까지 불러온 개수만 표시한다. */}
        {resource.data && (
          <span className="text-caption-web text-text-secondary">
            불러온 캠페인 {items.length}건
          </span>
        )}
        {resource.data?.nextPageToken && (
          <Button
            variant="neutral"
            disabled={resource.loading}
            onClick={resource.loadMore}
          >
            {resource.loading
              ? '불러오는 중'
              : resource.error
                ? '다시 불러오기'
                : '더 불러오기'}
          </Button>
        )}
        {resource.error && !resource.data && (
          <Button variant="neutral" onClick={resource.refresh}>
            다시 조회
          </Button>
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
      </div>
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
