import { useState } from 'react';
import { Button, DateRangePicker, SearchField, SelectField } from '@repo/ui';
import { formatDateTime, formatPoints } from '@repo/utils';

import type { PointLedgerItem, PointLedgerType } from '@admin/api/pointLedger';
import { AdminDrawer } from '@admin/components/AdminDrawer/AdminDrawer';
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
} from '@admin/components/DataTable';
import { FilterBar } from '@admin/components/FilterBar/FilterBar';
import { ledgerTypeLabels } from '@admin/features/billing/billingUtils';
import {
  type BillingTablePreferences,
  getMonthRange,
} from '@admin/features/billing/billingView';
import { PointLedgerDetails } from '@admin/features/billing/components/PointLedgerDetails';
import { usePointLedger } from '@admin/features/billing/usePointLedger';
import { useDebouncedSearch } from '@admin/hooks/useDebouncedSearch';

const columns: DataTableColumn[] = [
  { key: 'createdAt', label: '일시', width: '20%' },
  { key: 'ledgerId', label: '원장 ID', width: '9%' },
  { key: 'ownerId', label: '점주 ID', width: '9%' },
  { key: 'campaignId', label: '캠페인 ID', width: '11%' },
  { key: 'entryType', label: '변동 유형', width: '11%' },
  { key: 'balanceBefore', label: '사용 가능 잔액 (전)', width: '14%' },
  { key: 'amount', label: '거래 금액', width: '12%' },
  { key: 'balanceAfter', label: '사용 가능 잔액 (후)', width: '14%' },
];
// 숫자로 정규화할 때 ID가 반올림되지 않도록 JavaScript가 정확히 표현할 수 있는 정수만 받는다.
const isPositiveId = (value: string) =>
  /^\d+$/.test(value) &&
  Number.isSafeInteger(Number(value)) &&
  Number(value) > 0;

const getValidationError = (
  owner: string,
  campaign: string,
  from: string,
  to: string,
) => {
  if (!isPositiveId(owner)) return '점주 ID를 숫자로 입력해 주세요.';
  if (campaign && !isPositiveId(campaign))
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
}

export const PointLedgerTab = ({ preferences, today }: PointLedgerTabProps) => {
  const { density, setDensity, pageSize, setPageSize } = preferences;
  // 저장 키는 최초 열 구성의 값으로 고정해 열 추가·재배치 시에도 계정별 설정을 재사용한다.
  const columnSettings = useTableColumnSettings(
    'billing.점주 ID|변동 유형|사용 가능 잔액 (전)|거래 금액|사용 가능 잔액 (후)|일시',
    columns.map((column) => ({ ...column, key: column.label })),
  );
  const [selected, setSelected] = useState<PointLedgerItem | null>(null);
  const ownerSearch = useDebouncedSearch({ onCommit: () => setSelected(null) });
  const campaignSearch = useDebouncedSearch({
    onCommit: () => setSelected(null),
  });
  const [type, setType] = useState<PointLedgerType | 'ALL'>('ALL');
  const [range, setRange] = useState(() => getMonthRange(today));
  const owner = ownerSearch.keyword.trim();
  const campaign = campaignSearch.keyword.trim();
  const inputPending =
    ownerSearch.draftKeyword !== ownerSearch.keyword ||
    campaignSearch.draftKeyword !== campaignSearch.keyword;
  // 필수 ID가 비어 있거나 입력 중이면 오류 대신 입력 안내를 표시한다.
  const validationError =
    inputPending || !owner
      ? ''
      : getValidationError(owner, campaign, range.startDate, range.endDate);
  // 입력 중에는 기존 요청도 취소하고, 필수 조건이 유효해진 뒤에만 조회한다.
  const ledger = usePointLedger(
    pageSize,
    !inputPending && owner && !validationError
      ? {
          ownerId: String(Number(owner)),
          campaignId: campaign ? String(Number(campaign)) : '',
          type,
          from: range.startDate,
          to: range.endDate,
        }
      : null,
  );

  return (
    <>
      <p className="text-caption-web leading-5 text-text-secondary">
        점주 ID와 조회 기간을 입력하면 자동으로 조회됩니다. 사용 가능 잔액에는
        예약 중 포인트가 포함되지 않습니다. 소진은 예약 포인트에서 차감되므로
        사용 가능 잔액의 전후 금액이 같을 수 있습니다.
      </p>
      <FilterBar
        columnSettings={columnSettings}
        className="!px-0 !py-0"
        density={{ value: density, onValueChange: setDensity }}
      >
        <SearchField
          aria-label="점주 ID"
          placeholder="점주 ID를 입력하세요"
          inputMode="numeric"
          value={ownerSearch.draftKeyword}
          onChange={(event) => {
            ownerSearch.setDraftKeyword(event.target.value);
          }}
        />
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
            setType(value as PointLedgerType | 'ALL');
          }}
        />
        <DateRangePicker
          ariaLabel="조회 기간"
          placeholder="조회 기간 선택"
          value={range}
          onValueChange={(value) => {
            setRange(value);
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
                        ledger.changeSort();
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
              <TableError colSpan={columns.length} description={ledger.error} />
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
        </tbody>
      </DataTable>
      {ledger.data && ledger.error && (
        <p role="alert" className="mt-3 text-caption-web text-status-danger-fg">
          {ledger.error}
        </p>
      )}
      {ledger.data && ledger.hasNext && (
        <div className="mt-3 flex justify-center">
          <Button
            variant="neutral"
            disabled={ledger.loading}
            onClick={ledger.loadMore}
          >
            {ledger.loading ? '불러오는 중…' : '더보기'}
          </Button>
        </div>
      )}
      <div className="mt-3 flex flex-wrap items-center justify-end gap-3">
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
            setPageSize(Number(value));
          }}
        />
      </div>
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
    </>
  );
};
