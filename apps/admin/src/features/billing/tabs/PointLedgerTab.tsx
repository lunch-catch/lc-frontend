import { useState } from 'react';
import { Button, DateRangePicker, SearchField, SelectField } from '@repo/ui';
import { formatDateTime, formatPoints } from '@repo/utils';
import { SlidersHorizontal } from 'lucide-react';

import type { PointLedgerItem } from '@admin/api/pointLedger';
import { useUrlFilters } from '@admin/hooks/useUrlFilters';
import { useUrlSearch } from '@admin/hooks/useUrlSearch';
import { AdminDrawer } from '@admin/ui/AdminDrawer/AdminDrawer';
import {
  DataTable,
  type DataTableColumn,
  TableCell,
  TableEmpty,
  TableError,
  TableHeaderCell,
  TableLoading,
  TableRow,
  useTableColumnSettings,
} from '@admin/ui/DataTable';
import { FilterBar } from '@admin/ui/FilterBar/FilterBar';
import { LoadMoreButton } from '@admin/ui/Pagination/LoadMoreButton';

import { getLedgerQuery } from '../billingQuery';
import { ledgerTypeLabels } from '../billingUtils';
import { type BillingTablePreferences, getMonthRange } from '../billingView';
import { isPositivePointId } from '../pointSummaryUtils';
import { PointAdjustmentModal } from '../ui/PointAdjustmentModal';
import { PointLedgerDetails } from '../ui/PointLedgerDetails';
import { PointSummarySection } from '../ui/PointSummarySection';
import { usePointLedger } from '../usePointLedger';

const columns: DataTableColumn[] = [
  { key: 'createdAt', label: '일시', width: '20%', minWidth: 165 },
  { key: 'ledgerId', label: '원장 ID', width: '9%', minWidth: 90 },
  { key: 'ownerId', label: '점주 ID', width: '9%', minWidth: 90 },
  { key: 'campaignId', label: '캠페인 ID', width: '11%', minWidth: 105 },
  { key: 'entryType', label: '변동 유형', width: '11%', minWidth: 110 },
  {
    key: 'balanceBefore',
    label: '사용 가능 잔액 (전)',
    width: '14%',
    minWidth: 160,
  },
  { key: 'amount', label: '거래 금액', width: '12%', minWidth: 120 },
  {
    key: 'balanceAfter',
    label: '사용 가능 잔액 (후)',
    width: '14%',
    minWidth: 160,
  },
];

const getValidationError = (
  owner: string,
  campaign: string,
  from: string,
  to: string,
) => {
  if (!isPositivePointId(owner)) return '점주 ID를 숫자로 입력해 주세요.';
  if (campaign && !isPositivePointId(campaign))
    return '캠페인 ID를 숫자로 입력해 주세요.';
  // 서버는 KST 양 끝 날짜를 포함해 최대 31일까지 받는다. 날짜 문자열의 차이로 일수를 계산한다.
  const days = (Date.parse(to) - Date.parse(from)) / 86_400_000 + 1;
  if (!from || !to || !Number.isFinite(days) || days < 1 || days > 31)
    return '조회 기간을 시작일부터 종료일까지 최대 31일로 선택해 주세요.';
  return '';
};

interface PointLedgerTabProps {
  preferences: BillingTablePreferences;
  today: string;
  onAdjusted: (ledgerId: number) => void;
}

export const PointLedgerTab = ({
  preferences,
  today,
  onAdjusted,
}: PointLedgerTabProps) => {
  const [adjusting, setAdjusting] = useState(false);
  const { density, setDensity } = preferences;
  // 저장 키는 최초 열 구성의 값으로 고정해 열 추가·재배치 시에도 계정별 설정을 재사용한다.
  const columnSettings = useTableColumnSettings(
    'billing.점주 ID|변동 유형|사용 가능 잔액 (전)|거래 금액|사용 가능 잔액 (후)|일시',
    columns.map((column) => ({ ...column, key: column.label })),
  );
  const [selected, setSelected] = useState<PointLedgerItem | null>(null);
  const defaultRange = getMonthRange(today);
  const { filters, updateFilters } = useUrlFilters(
    'ledger.',
    getLedgerQuery(defaultRange.startDate, defaultRange.endDate),
  );
  const { type, size: pageSize, sortDir } = filters;
  const range = { startDate: filters.from, endDate: filters.to };
  const ownerSearch = useUrlSearch(filters.ownerId, (ownerId) => {
    updateFilters({ ownerId });
    setSelected(null);
  });
  const campaignSearch = useUrlSearch(filters.campaignId, (campaignId) => {
    updateFilters({ campaignId });
    setSelected(null);
  });
  const owner = ownerSearch.keyword.trim();
  const campaign = campaignSearch.keyword.trim();
  const ownerInputPending = ownerSearch.draftKeyword !== ownerSearch.keyword;
  // 두 조회가 동일한 점주를 사용하도록 디바운스와 ID 정규화를 한 번만 적용한다.
  const selectedOwnerId =
    !ownerInputPending && isPositivePointId(owner)
      ? String(Number(owner))
      : null;
  const inputPending =
    ownerInputPending || campaignSearch.draftKeyword !== campaignSearch.keyword;
  // 필수 ID가 비어 있거나 입력 중이면 오류 대신 입력 안내를 표시한다.
  const validationError =
    inputPending || !owner
      ? ''
      : getValidationError(owner, campaign, range.startDate, range.endDate);
  // 입력 중에는 기존 요청도 취소하고, 필수 조건이 유효해진 뒤에만 조회한다.
  const ledger = usePointLedger(
    pageSize,
    !inputPending && selectedOwnerId && !validationError
      ? {
          ownerId: selectedOwnerId,
          campaignId: campaign ? String(Number(campaign)) : '',
          type,
          from: range.startDate,
          to: range.endDate,
        }
      : null,
    sortDir,
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-body-sm-web font-medium text-text-primary">
          조회할 점주 ID
        </span>
        <SearchField
          aria-label="점주 ID"
          placeholder="점주 ID를 입력하세요"
          inputMode="numeric"
          value={ownerSearch.draftKeyword}
          onChange={(event) => ownerSearch.setDraftKeyword(event.target.value)}
        />
        <Button
          className="ml-auto"
          variant="primary"
          leadingIcon={
            <SlidersHorizontal aria-hidden="true" className="size-4" />
          }
          onClick={() => setAdjusting(true)}
        >
          포인트 수동 조정
        </Button>
      </div>
      <PointSummarySection
        ownerId={selectedOwnerId}
        today={today}
        preferences={preferences}
      />
      <section
        aria-label="개별 포인트 변동 내역"
        className="flex flex-col gap-4"
      >
        <div className="flex flex-col gap-1">
          <h3 className="text-heading-sm-web font-semibold text-text-primary">
            개별 포인트 변동 내역
          </h3>
          <p className="text-caption-web leading-5 text-text-secondary">
            점주 ID와 조회 기간을 입력하면 자동으로 조회됩니다. 사용 가능
            잔액에는 예약 중 포인트가 포함되지 않습니다. 소진은 예약 포인트에서
            차감되므로 사용 가능 잔액의 전후 금액이 같을 수 있습니다.
          </p>
        </div>
        <FilterBar
          columnSettings={columnSettings}
          className="!px-0 !py-0"
          density={{ value: density, onValueChange: setDensity }}
        >
          <SearchField
            aria-label="캠페인 ID"
            placeholder="캠페인 ID (선택)"
            inputMode="numeric"
            value={campaignSearch.draftKeyword}
            onChange={(event) => {
              campaignSearch.setDraftKeyword(event.target.value);
            }}
          />
          <SelectField
            aria-label="변동 유형"
            fitContent
            value={type}
            options={[
              { label: '전체', value: 'ALL' },
              ...Object.entries(ledgerTypeLabels).map(([value, label]) => ({
                value,
                label,
              })),
            ]}
            onValueChange={(value) => {
              setSelected(null);
              updateFilters({ type: value as typeof type });
            }}
          />
          <DateRangePicker
            ariaLabel="조회 기간"
            placeholder="조회 기간 선택"
            value={range}
            onValueChange={(value) => {
              updateFilters({ from: value.startDate, to: value.endDate });
              setSelected(null);
            }}
          />
        </FilterBar>
        {validationError && (
          <p role="alert" className="text-caption-web text-status-danger-fg">
            {validationError}
          </p>
        )}
        <DataTable
          columnSettings={columnSettings}
          columns={columns}
          density={density}
          resizableColumns
          className="table-fixed"
        >
          <thead>
            <tr>
              {columns.map((column, index) => (
                <TableHeaderCell
                  key={column.key}
                  columnIndex={index}
                  onSortChange={
                    column.key === 'createdAt'
                      ? () => {
                          setSelected(null);
                          updateFilters({
                            sortDir: sortDir === 'desc' ? 'asc' : 'desc',
                          });
                        }
                      : undefined
                  }
                  sortDirection={
                    column.key === 'createdAt' ? ledger.sortDir : undefined
                  }
                >
                  {column.label}
                </TableHeaderCell>
              ))}
            </tr>
          </thead>
          <tbody>
            {!ledger.enabled ? (
              <tr>
                <TableEmpty colSpan={columns.length}>
                  {inputPending
                    ? '입력이 끝나면 자동으로 조회됩니다'
                    : '점주 ID와 조회 기간을 입력해 주세요'}
                </TableEmpty>
              </tr>
            ) : ledger.loading && !ledger.data ? (
              <tr>
                <TableLoading colSpan={columns.length} />
              </tr>
            ) : ledger.error && !ledger.data ? (
              <tr>
                <TableError
                  colSpan={columns.length}
                  description={ledger.error}
                  onRetry={ledger.retry}
                />
              </tr>
            ) : !ledger.data?.items.length ? (
              <tr>
                <TableEmpty colSpan={columns.length}>
                  조회된 포인트 변동 내역이 없습니다
                </TableEmpty>
              </tr>
            ) : (
              ledger.data.items.map((item) => (
                <TableRow
                  key={item.ledgerId}
                  showDetailArrow
                  className="cursor-pointer"
                  onClick={() => setSelected(item)}
                >
                  <TableCell>
                    <button
                      type="button"
                      className="text-left hover:text-action-primary focus-visible:outline-2 focus-visible:outline-action-primary"
                      aria-label={`원장 ${item.ledgerId} 상세 보기`}
                      onClick={(event) => {
                        event.stopPropagation();
                        setSelected(item);
                      }}
                    >
                      {formatDateTime(item.createdAt)}
                    </button>
                  </TableCell>
                  <TableCell>{item.ledgerId}</TableCell>
                  <TableCell>{item.ownerId}</TableCell>
                  <TableCell>{item.campaignId ?? '-'}</TableCell>
                  <TableCell>{ledgerTypeLabels[item.entryType]}</TableCell>
                  {/* 필터·커서로 일부 행만 받은 상태에서는 잔액을 재계산하지 않고 서버의 누적값을 표시한다. */}
                  <TableCell>{formatPoints(item.balanceBefore)}</TableCell>
                  <TableCell>{formatPoints(item.amount)}</TableCell>
                  <TableCell>{formatPoints(item.balanceAfter)}</TableCell>
                </TableRow>
              ))
            )}
            {ledger.data && ledger.error && (
              <tr>
                <TableError
                  colSpan={columns.length}
                  description={ledger.error}
                  onRetry={ledger.retry}
                />
              </tr>
            )}
          </tbody>
        </DataTable>
        <LoadMoreButton
          hasMore={Boolean(ledger.data && ledger.hasNext && !ledger.error)}
          loading={ledger.loading}
          onClick={ledger.loadMore}
          controls={
            <>
              {/* 커서 응답에는 전체 건수가 없으므로 현재 받은 항목 수만 안내한다. */}
              {ledger.data && (
                <span className="text-caption-web text-text-secondary">
                  불러온 내역 {ledger.data.items.length}건
                </span>
              )}
              <SelectField
                aria-label="한 번에 불러올 항목 수"
                fitContent
                menuPlacement="top"
                size="compact"
                value={String(pageSize)}
                options={[5, 10, 20, 50].map((value) => ({
                  label: `${value}개씩 불러오기`,
                  value: String(value),
                }))}
                onValueChange={(value) => {
                  setSelected(null);
                  updateFilters({ size: Number(value) });
                }}
              />
            </>
          }
        />
      </section>
      <AdminDrawer
        open={selected !== null}
        onClose={() => setSelected(null)}
        title="포인트 변동 상세"
        resizable
      >
        {/* 다른 원장을 열면 복사 성공·실패 안내도 해당 원장 기준으로 초기화한다. */}
        {selected && (
          <PointLedgerDetails key={selected.ledgerId} item={selected} />
        )}
      </AdminDrawer>
      {adjusting && (
        <PointAdjustmentModal
          ownerId={selectedOwnerId ?? ''}
          onClose={() => setAdjusting(false)}
          onSaved={onAdjusted}
        />
      )}
    </div>
  );
};
