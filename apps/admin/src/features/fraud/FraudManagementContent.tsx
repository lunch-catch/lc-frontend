import {
  Button,
  DateRangePicker,
  SearchField,
  SelectField,
  StatusBadge,
  Tabs,
} from '@repo/ui';
import { formatNumber } from '@repo/utils';

import type { CampaignWarning, InvalidImpression } from '@admin/api/fraud';
import { useTableColumnSettings } from '@admin/ui/DataTable';
import { FilterBar } from '@admin/ui/FilterBar/FilterBar';
import { PaginationSummary } from '@admin/ui/Pagination/PaginationSummary';

import { type FraudColumn, FraudTable } from './FraudTable';
import { formatFraudRatio, invalidReasonLabels } from './fraudUtils';
import { useFraudManagement } from './useFraudManagement';

const invalidColumns: FraudColumn<InvalidImpression>[] = [
  {
    key: 'memberId',
    label: '사용자 ID',
    minWidth: 110,
    sortable: true,
    render: (item) => item.memberId,
  },
  {
    key: 'campaignId',
    label: '캠페인 ID',
    minWidth: 110,
    sortable: true,
    render: (item) => item.campaignId,
  },
  {
    key: 'reasonCode',
    label: '무효 사유',
    minWidth: 230,
    render: (item) => (
      <span title={item.reasonCode}>
        {invalidReasonLabels[item.reasonCode]}
      </span>
    ),
  },
  {
    key: 'count',
    label: '무효 노출 수',
    align: 'right',
    minWidth: 130,
    sortable: true,
    render: (item) => formatNumber(item.count) + '건',
  },
];
export const FraudManagementContent = () => {
  const state = useFraudManagement();
  const {
    filters,
    updateFilters,
    invalid,
    warnings,
    resource,
    validation,
    density,
    setDensity,
    pagination,
    sortBy,
  } = state;
  const warningColumns: FraudColumn<CampaignWarning>[] = [
    {
      key: 'campaignId',
      label: '캠페인 ID',
      minWidth: 110,
      sortable: true,
      render: (item) => item.campaignId,
    },
    {
      key: 'validCount',
      label: '유효 노출',
      align: 'right',
      minWidth: 100,
      render: (item) => formatNumber(item.validCount),
    },
    {
      key: 'invalidCount',
      label: '무효 노출',
      align: 'right',
      minWidth: 100,
      render: (item) => formatNumber(item.invalidCount),
    },
    {
      key: 'invalidRatio',
      label: '무효 / 유효 비율',
      align: 'right',
      minWidth: 150,
      sortable: true,
      render: (item) => formatFraudRatio(item.invalidRatio),
    },
    {
      key: 'distinctMemberCount',
      label: '집중일 회원 수',
      align: 'right',
      minWidth: 140,
      render: (item) => formatNumber(item.distinctMemberCount),
    },
    {
      key: 'topMembersShare',
      label: '상위 회원 점유율',
      align: 'right',
      minWidth: 155,
      sortable: true,
      render: (item) => formatFraudRatio(item.topMembersShare),
    },
    {
      key: 'warnings',
      label: '경고',
      minWidth: 230,
      render: (item) => (
        <div className="flex flex-wrap gap-1">
          {item.invalidRatioWarning && (
            <StatusBadge variant="danger">무효 비율</StatusBadge>
          )}
          {item.concentrationWarning && (
            <StatusBadge variant="warning">소수 회원 집중</StatusBadge>
          )}
        </div>
      ),
    },
    {
      key: 'action',
      label: '무효 내역',
      minWidth: 120,
      render: (item) => (
        <button
          type="button"
          className="rounded-md text-text-brand hover:underline focus-visible:outline-2 focus-visible:outline-action-primary"
          onClick={() => {
            state.campaign.setDraftKeyword(String(item.campaignId));
            state.member.setDraftKeyword('');
            updateFilters({
              tab: 'impressions',
              campaignId: String(item.campaignId),
              memberId: '',
              reason: 'ALL',
              sortBy: 'count',
              page: 1,
            });
          }}
        >
          내역 보기
        </button>
      ),
    },
  ];
  const columns =
    filters.tab === 'impressions' ? invalidColumns : warningColumns;
  const settings = useTableColumnSettings('fraud.' + filters.tab, columns);
  const onSort = (key: string) => {
    if (
      key === 'count' ||
      key === 'memberId' ||
      key === 'campaignId' ||
      key === 'invalidRatio' ||
      key === 'topMembersShare'
    )
      state.sort(key);
  };
  return (
    <section className="flex flex-col">
      <header className="mb-4">
        <h2 className="text-display-web font-semibold text-text-primary">
          부정 관리
        </h2>
        <p className="mt-2 text-body-sm-web text-text-secondary">
          무효 노출과 캠페인 경고를 조회합니다. 조회 기간은 최대 31일입니다.
        </p>
      </header>
      <Tabs
        items={[
          { label: '무효 노출', value: 'impressions' },
          { label: '캠페인 경고', value: 'warnings' },
        ]}
        value={filters.tab}
        onValueChange={(tab) => {
          if (tab === 'impressions' || tab === 'warnings')
            updateFilters({ tab, page: 1, sortBy: '', sortDir: 'desc' });
        }}
      />
      <FilterBar
        className="mb-3 mt-3"
        columnSettings={settings}
        density={{ value: density, onValueChange: setDensity }}
        pagination={pagination}
      >
        {filters.tab === 'impressions' ? (
          <>
            <SearchField
              aria-label="캠페인 ID 검색"
              placeholder="캠페인 ID"
              value={state.campaign.draftKeyword}
              onChange={(event) =>
                state.campaign.setDraftKeyword(event.target.value)
              }
            />
            <SearchField
              aria-label="사용자 ID 검색"
              placeholder="사용자 ID"
              value={state.member.draftKeyword}
              onChange={(event) =>
                state.member.setDraftKeyword(event.target.value)
              }
            />
            <SelectField
              aria-label="무효 사유"
              fitContent
              value={filters.reason}
              options={[
                { label: '사유 전체', value: 'ALL' },
                ...Object.entries(invalidReasonLabels).map(
                  ([value, label]) => ({ value, label }),
                ),
              ]}
              onValueChange={(reason) => {
                if (
                  reason === 'ALL' ||
                  reason === 'EXPIRED_OR_UNKNOWN' ||
                  reason === 'NOT_OWNER'
                )
                  updateFilters({ reason, page: 1 });
              }}
            />
          </>
        ) : (
          <SelectField
            aria-label="경고 유형"
            fitContent
            value={filters.type}
            options={[
              { label: '경고 전체', value: 'ALL' },
              { label: '무효 비율', value: 'INVALID_RATIO' },
              { label: '소수 회원 집중', value: 'CONCENTRATION' },
            ]}
            onValueChange={(type) => {
              if (
                type === 'ALL' ||
                type === 'INVALID_RATIO' ||
                type === 'CONCENTRATION'
              )
                updateFilters({ type, page: 1 });
            }}
          />
        )}
        <DateRangePicker
          ariaLabel="부정 관리 조회 기간"
          value={{ startDate: filters.from, endDate: filters.to }}
          onValueChange={(value) =>
            updateFilters({ from: value.startDate, to: value.endDate, page: 1 })
          }
        />
      </FilterBar>
      {filters.tab === 'impressions' && (
        <div className="mb-4 grid gap-3 sm:grid-cols-2">
          {Object.entries(invalidReasonLabels)
            .filter(
              ([reason]) =>
                filters.reason === 'ALL' || filters.reason === reason,
            )
            .map(([reason, label]) => {
              const count = invalid.data?.summaryByReason.find(
                (item) => item.reasonCode === reason,
              )?.count;
              return (
                <div
                  key={reason}
                  className="rounded-xl border border-border-subtle bg-bg-surface p-4"
                >
                  <p className="text-caption-web text-text-secondary">
                    {label}
                  </p>
                  <p className="mt-2 text-h2-web font-semibold">
                    {count === undefined ? '—' : formatNumber(count) + '건'}
                  </p>
                  <p className="mt-1 text-caption-web text-text-secondary">
                    {reason}
                  </p>
                </div>
              );
            })}
        </div>
      )}
      {filters.tab === 'warnings' && (
        <p className="mb-3 text-caption-web text-text-secondary">
          무효 비율 = 무효 ÷ 유효로 100%를 넘을 수 있습니다. 경고 판정은 서버
          결과를 따릅니다. 상위 회원 점유율은 가장 집중된 하루 기준입니다.
        </p>
      )}
      {validation && (
        <p role="status" className="mb-3 text-body-sm-web text-text-secondary">
          {validation}
        </p>
      )}
      {filters.tab === 'impressions' ? (
        <FraudTable
          label="무효 노출 목록"
          columns={invalidColumns}
          rows={invalid.data?.items ?? []}
          rowKey={(item) =>
            [item.memberId, item.campaignId, item.reasonCode].join(':')
          }
          loading={invalid.loading}
          error={invalid.error}
          emptyMessage={validation || '조회된 무효 노출이 없습니다.'}
          density={density}
          settings={settings}
          sortBy={sortBy}
          sortDir={filters.sortDir}
          onSort={onSort}
        />
      ) : (
        <FraudTable
          label="캠페인 경고 목록"
          columns={warningColumns}
          rows={warnings.data?.items ?? []}
          rowKey={(item) => item.campaignId}
          loading={warnings.loading}
          error={warnings.error}
          emptyMessage={validation || '조회된 캠페인 경고가 없습니다.'}
          density={density}
          settings={settings}
          sortBy={sortBy}
          sortDir={filters.sortDir}
          onSort={onSort}
        />
      )}
      {resource.error && (
        <div className="mt-3 flex justify-end">
          <Button variant="neutral" onClick={resource.refresh}>
            다시 시도
          </Button>
        </div>
      )}
      <PaginationSummary {...pagination} />
    </section>
  );
};
