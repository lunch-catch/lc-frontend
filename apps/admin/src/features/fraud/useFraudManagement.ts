import { useMemo, useState } from 'react';

import type { TableDensity } from '@admin/components/DataTable/DataTable';
import { useDebouncedSearch } from '@admin/hooks/useDebouncedSearch';

import type {
  FraudFilters,
  FraudSort,
  FraudSortKey,
  FraudTab,
  FraudTableRow,
} from './fraudTypes';
import { buildFraudView, sortFraudRows } from './fraudUtils';
import { useFraudReport } from './useFraudReport';

export const useFraudManagement = () => {
  const [tab, setTab] = useState<FraudTab>('impressions');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [density, setDensity] = useState<TableDensity>('normal');
  const [period, setPeriod] = useState({ startDate: '', endDate: '' });
  const [reasonCode, setReasonCode] =
    useState<FraudFilters['reasonCode']>('ALL');
  const [sort, setSort] = useState<FraudSort | null>(null);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(
    null,
  );
  const search = useDebouncedSearch({
    onCommit: () => setCurrentPage(1),
  });
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
    onPageChange: setCurrentPage,
    onPageSizeChange: (value: number) => {
      // 표시 개수가 줄면 현재 페이지가 사라질 수 있어 첫 페이지로 이동한다.
      setPageSize(value);
      setCurrentPage(1);
    },
  };
  const handleSortChange = (key: FraudSortKey) => {
    setCurrentPage(1);
    // 공통 테이블 버튼의 안내와 동일하게 내림차순 → 오름차순 → 해제 순서를 따른다.
    setSort((previous) => {
      if (!previous || previous.key !== key) return { key, direction: 'desc' };
      if (previous.direction === 'desc') return { key, direction: 'asc' };
      return null;
    });
  };
  const changeTab = (value: string) => {
    // 기간·검색어는 유지하고 탭마다 다른 열의 정렬과 상세 선택만 해제한다.
    setTab(value as FraudTab);
    setCurrentPage(1);
    setSort(null);
    setSelectedCampaignId(null);
  };
  const changeReason = (value: string) => {
    setReasonCode(value as FraudFilters['reasonCode']);
    setCurrentPage(1);
  };
  const changePeriod = (value: { startDate: string; endDate: string }) => {
    setPeriod(value);
    setCurrentPage(1);
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
