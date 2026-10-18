import { useMemo, useState } from 'react';

import {
  queryChoice,
  queryDate,
  queryPage,
  queryPageSize,
  queryText,
} from '@admin/hooks/urlQuery';
import { useUrlFilters } from '@admin/hooks/useUrlFilters';
import { useUrlSearch } from '@admin/hooks/useUrlSearch';
import type { TableDensity } from '@admin/ui/DataTable';

import type {
  FraudFilters,
  FraudSort,
  FraudSortKey,
  FraudTableRow,
} from './fraudTypes';
import { buildFraudView, sortFraudRows } from './fraudUtils';
import { useFraudReport } from './useFraudReport';

const fraudQuery = {
  tab: queryChoice(['impressions', 'requests'] as const, 'impressions'),
  keyword: queryText(),
  page: queryPage,
  size: queryPageSize(10),
  from: queryDate(),
  to: queryDate(),
  reason: queryChoice(
    ['ALL', 'EXPIRED_OR_UNKNOWN', 'NOT_OWNER'] as const,
    'ALL',
  ),
  sortBy: queryChoice(
    ['', 'campaignId', 'userId', 'reasonCode', 'count'] as const,
    '',
  ),
  sortDir: queryChoice(['asc', 'desc'] as const, 'desc'),
};
export const useFraudManagement = () => {
  const { filters: query, updateFilters } = useUrlFilters('fraud.', fraudQuery);
  const { tab, page: currentPage, size: pageSize, reason: reasonCode } = query;
  const period = useMemo(
    () => ({ startDate: query.from, endDate: query.to }),
    [query.from, query.to],
  );
  const sort = useMemo<FraudSort | null>(
    () =>
      query.sortBy ? { key: query.sortBy, direction: query.sortDir } : null,
    [query.sortBy, query.sortDir],
  );
  const [density, setDensity] = useState<TableDensity>('normal');
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(
    null,
  );
  const search = useUrlSearch(query.keyword, (keyword) =>
    updateFilters({ keyword, page: 1 }),
  );
  const state = useFraudReport();
  // 화면과 상세 패널이 동일한 기간·검색 조건을 공유한다.
  const filters = useMemo<FraudFilters>(
    () => ({
      ...period,
      reasonCode,
      keyword: search.keyword,
    }),
    [period, reasonCode, search.keyword],
  );
  const view = useMemo(
    () => (state.report ? buildFraudView(state.report, filters) : null),
    [state.report, filters],
  );
  const warningCampaigns =
    view?.campaigns.filter(
      (campaign) => campaign.highInvalidRate || campaign.concentrated,
    ) ?? [];
  const selectedCampaign = view?.campaigns.find(
    (campaign) => campaign.campaignId === selectedCampaignId,
  );
  const rows: FraudTableRow[] =
    tab === 'impressions'
      ? (view?.invalidRows ?? [])
      : (view?.rejectionRows.map((row) => ({ ...row, id: row.userId })) ?? []);
  const sortedRows = sortFraudRows(rows, sort);
  const pagination = {
    currentPage,
    pageSize,
    totalCount: rows.length,
    totalPages: Math.ceil(rows.length / pageSize),
    onPageChange: (page: number) => updateFilters({ page }),
    onPageSizeChange: (value: number) => {
      // 표시 개수가 줄면 현재 페이지가 사라질 수 있어 첫 페이지로 이동한다.
      updateFilters({ size: value, page: 1 });
    },
  };
  const handleSortChange = (key: FraudSortKey) => {
    updateFilters({
      page: 1,
      sortBy: sort?.key !== key ? key : sort.direction === 'desc' ? key : '',
      sortDir: sort?.key === key && sort.direction === 'desc' ? 'asc' : 'desc',
    });
  };
  const changeTab = (value: string) => {
    updateFilters({
      tab: value as typeof tab,
      page: 1,
      sortBy: '',
      sortDir: 'desc',
    });
    setSelectedCampaignId(null);
  };
  const changeReason = (value: string) =>
    updateFilters({ reason: value as typeof reasonCode, page: 1 });
  const changePeriod = (value: { startDate: string; endDate: string }) => {
    updateFilters({ from: value.startDate, to: value.endDate, page: 1 });
    setSelectedCampaignId(null);
  };

  return {
    tab,
    density,
    setDensity,
    period,
    reasonCode,
    sort,
    selectedCampaignId,
    setSelectedCampaignId,
    search,
    state,
    filters,
    view,
    warningCampaigns,
    selectedCampaign,
    visibleRows: sortedRows.slice(
      (currentPage - 1) * pageSize,
      currentPage * pageSize,
    ),
    pagination,
    handleSortChange,
    changeTab,
    changeReason,
    changePeriod,
  };
};
