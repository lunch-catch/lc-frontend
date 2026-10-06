import {
  Button,
  DateRangePicker,
  SearchField,
  SelectField,
  StatusBadge,
  Tabs,
} from '@repo/ui';
import { formatNumber } from '@repo/utils';

import { AdminDrawer } from '@admin/components/AdminDrawer/AdminDrawer';
import { FilterBar } from '@admin/components/FilterBar/FilterBar';
import { PaginationSummary } from '@admin/components/Pagination/PaginationSummary';

import { FraudCampaignDetail } from './FraudCampaignDetail';
import { FraudTable } from './FraudTable';
import { invalidReasonDescriptions } from './fraudUtils';
import { useFraudManagement } from './useFraudManagement';

interface FraudManagementContentProps {
  onManageMember: (userId: string) => void;
}

const tabs = [
  { label: '무효 노출', value: 'impressions' },
  { label: '피드 요청 제한 초과', value: 'requests' },
];
const reasonOptions = [
  { label: '무효 사유 전체', value: 'ALL' },
  { label: 'EXPIRED_OR_UNKNOWN', value: 'EXPIRED_OR_UNKNOWN' },
  { label: 'NOT_OWNER', value: 'NOT_OWNER' },
];

export const FraudManagementContent = ({
  onManageMember,
}: FraudManagementContentProps) => {
  // 조회·정렬·페이지 상태는 훅에서 관리하고 공통 UI와 도메인 상세를 조합한다.
  const {
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
    visibleRows,
    pagination,
    handleSortChange,
    changeTab,
    changeReason,
    changePeriod,
  } = useFraudManagement();
  const summaryCards = [
    {
      label: 'EXPIRED_OR_UNKNOWN',
      count: view?.expiredOrUnknownCount,
      description: invalidReasonDescriptions.EXPIRED_OR_UNKNOWN,
    },
    {
      label: 'NOT_OWNER',
      count: view?.notOwnerCount,
      description: invalidReasonDescriptions.NOT_OWNER,
    },
    {
      label: '피드 요청 제한 초과',
      count: view?.rejectionCount,
      description: '사용자별 피드 요청 제한으로 거부된 건수',
    },
  ];

  return (
    <section className="flex flex-col">
      <header className="mb-4">
        <h2 className="text-display-web font-semibold text-text-primary">
          부정 관리
        </h2>
        <p className="mt-2 text-body-sm-web text-text-secondary">
          무효 노출과 피드 요청 제한 초과 내역을 조회하고 부정 의심 계정을
          검토합니다.
        </p>
      </header>
      <div className="mb-5 grid gap-3 lg:grid-cols-3">
        {summaryCards.map(({ label, count, description }) => (
          <div
            className="rounded-xl border border-border-subtle bg-bg-surface p-5"
            key={label}
          >
            <p className="text-caption-web font-medium text-text-secondary">
              {label}
            </p>
            <p className="mt-2 text-title-sm-web font-semibold text-text-primary">
              {count === undefined ? '—' : `${formatNumber(count)}건`}
            </p>
            <p className="mt-2 text-caption-web text-text-secondary">
              {description}
            </p>
          </div>
        ))}
      </div>
      {tab === 'impressions' && warningCampaigns.length > 0 && (
        <section
          aria-label="부정 의심 캠페인 경고"
          className="mb-5 rounded-xl border border-status-warning-border bg-bg-surface p-4"
        >
          <h3 className="text-body-sm-web font-semibold text-text-primary">
            확인이 필요한 캠페인 {warningCampaigns.length}개
          </h3>
          <p className="mt-1 text-caption-web text-text-secondary">
            무효 비율은 무효 / (유효 + 무효)입니다. 20% 초과 또는 소수 계정의
            반복 노출이 감지되면 경고합니다.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {warningCampaigns.map((campaign) => (
              <button
                className="flex flex-wrap items-center gap-2 rounded-md border border-border-subtle bg-bg-surface px-3 py-2 text-caption-web focus-visible:outline-2 focus-visible:outline-action-primary"
                key={campaign.campaignId}
                onClick={() => setSelectedCampaignId(campaign.campaignId)}
                type="button"
              >
                <span className="font-medium text-text-primary">
                  {campaign.campaignId}
                </span>
                {campaign.highInvalidRate && (
                  <StatusBadge variant="danger">
                    무효 {(campaign.invalidRate * 100).toFixed(1)}%
                  </StatusBadge>
                )}
                {campaign.concentrated && (
                  <StatusBadge variant="warning">소수 계정 집중</StatusBadge>
                )}
                <span className="text-action-primary">사용자별 노출 보기</span>
              </button>
            ))}
          </div>
        </section>
      )}
      <Tabs items={tabs} value={tab} onValueChange={changeTab} />
      <FilterBar
        className="mb-2 mt-3"
        density={{ value: density, onValueChange: setDensity }}
        pagination={pagination}
      >
        {/* 캠페인·사용자 ID를 함께 검색하고 피드 요청 탭에서는 사용자 ID만 검색한다. */}
        <SearchField
          aria-label={
            tab === 'impressions'
              ? '캠페인 ID 또는 사용자 ID 검색'
              : '사용자 ID 검색'
          }
          placeholder={
            tab === 'impressions'
              ? '캠페인 ID, 사용자 ID 등을 검색'
              : '사용자 ID 등을 검색'
          }
          value={search.draftKeyword}
          onChange={(event) => search.setDraftKeyword(event.target.value)}
        />
        {tab === 'impressions' && (
          <SelectField
            aria-label="무효 사유 코드"
            fitContent
            options={reasonOptions}
            value={reasonCode}
            onValueChange={changeReason}
          />
        )}
        <div className="w-[216px]">
          <DateRangePicker
            aria-label="집계 기간"
            value={period}
            onValueChange={changePeriod}
          />
        </div>
      </FilterBar>
      <p className="mb-3 px-3 text-caption-web text-text-secondary">
        {tab === 'impressions'
          ? '기간·캠페인·사용자·사유별 합산 결과입니다. 캠페인 경고는 선택 기간의 전체 사용자·사유 기준입니다.'
          : '기간·사용자별 합산 결과입니다. 사용자 ID로 검색하며 무효 사유 조건은 적용하지 않습니다.'}
      </p>
      <FraudTable
        tab={tab}
        rows={visibleRows}
        campaigns={view?.campaigns ?? []}
        density={density}
        status={state.status}
        sort={sort}
        onSortChange={handleSortChange}
        onManageMember={onManageMember}
      />
      {state.status === 'error' && (
        <div className="mt-3 flex justify-end">
          <Button variant="neutral" onClick={state.retry}>
            다시 시도
          </Button>
        </div>
      )}
      {state.status === 'success' && <PaginationSummary {...pagination} />}
      <AdminDrawer
        open={Boolean(selectedCampaign && state.report)}
        onClose={() => setSelectedCampaignId(null)}
        title={`${selectedCampaignId ?? ''} 노출 집계`}
        width={680}
        resizable
      >
        {selectedCampaign && state.report && (
          <FraudCampaignDetail
            campaign={selectedCampaign}
            report={state.report}
            filters={filters}
            onManageMember={onManageMember}
          />
        )}
      </AdminDrawer>
    </section>
  );
};
