import { useState } from 'react';
import {
  DateRangePicker,
  type DateRangeSelectionMode,
  getDateRangeUnit,
  SelectField,
} from '@repo/ui';
import { formatPoints } from '@repo/utils';

import type {
  PointSummaryItem,
  PointSummaryPeriod,
} from '@admin/api/pointSummary';
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
import type { BillingTablePreferences } from '@admin/features/billing/billingView';
import { getMonthRange } from '@admin/features/billing/billingView';
import {
  getPointSummaryRangeError,
  pointSummaryPeriods,
} from '@admin/features/billing/pointSummaryUtils';
import { usePointSummary } from '@admin/features/billing/usePointSummary';

const amounts: { key: keyof Omit<PointSummaryItem, 'label'>; label: string }[] =
  [
    { key: 'chargeAmount', label: '충전' },
    { key: 'spentAmount', label: '소진' },
    { key: 'adjustAmount', label: '조정' },
    { key: 'refundAmount', label: '환불' },
    { key: 'reservedAmount', label: '예약' },
    { key: 'releasedAmount', label: '예약 해제' },
  ];
const columns: DataTableColumn[] = [
  { key: 'label', label: '기간', minWidth: 150, width: '20%' },
  ...amounts.map((item) => ({
    ...item,
    align: 'right' as const,
    minWidth: 130,
    width: `${80 / 6}%`,
  })),
];

const selectionModes: Record<PointSummaryPeriod, DateRangeSelectionMode> = {
  DAILY: 'day',
  WEEKLY: 'week',
  MONTHLY: 'month',
};

interface PointSummarySectionProps {
  ownerId: string | null;
  today: string;
  preferences: BillingTablePreferences;
}

export const PointSummarySection = ({
  ownerId,
  today,
  preferences,
}: PointSummarySectionProps) => {
  const [period, setPeriod] = useState<PointSummaryPeriod>('DAILY');
  const [range, setRange] = useState(() => ({
    ...getMonthRange(today),
    endDate: today,
  }));
  const { density, setDensity } = preferences;
  const columnSettings = useTableColumnSettings(
    'billing.point-summary',
    columns,
  );
  const validationError = getPointSummaryRangeError(
    range.startDate,
    range.endDate,
    period,
  );
  const summary = usePointSummary(
    ownerId && !validationError
      ? { ownerId, period, from: range.startDate, to: range.endDate }
      : null,
  );

  return (
    <section
      aria-label="기간별 포인트 합계"
      className="flex flex-col gap-4 border-b border-border-subtle pb-6"
    >
      <div className="flex flex-col gap-1">
        <h3 className="text-heading-sm-web font-semibold text-text-primary">
          기간별 포인트 합계
        </h3>
        <p className="text-caption-web leading-5 text-text-secondary">
          일별 최대 92일 · 주별 최대 53주 · 월별 최대 13개월 조회 가능하며
          주별은 월요일 기준입니다.
        </p>
      </div>
      <FilterBar
        className="!px-0 !py-0"
        columnSettings={columnSettings}
        density={{ value: density, onValueChange: setDensity }}
      >
        <SelectField
          aria-label="합계 집계 단위"
          fitContent
          value={period}
          options={pointSummaryPeriods}
          onValueChange={(value) => {
            const nextPeriod = value as PointSummaryPeriod;
            const mode = selectionModes[nextPeriod];
            // 조회 단위 변경과 날짜 보정을 함께 반영해 부분 주·월 범위로 요청하지 않는다.
            setRange((current) => ({
              startDate: current.startDate
                ? getDateRangeUnit(current.startDate, mode).startDate
                : '',
              endDate: current.endDate
                ? getDateRangeUnit(current.endDate, mode).endDate
                : '',
            }));
            setPeriod(nextPeriod);
          }}
        />
        <DateRangePicker
          key={period}
          selectionMode={selectionModes[period]}
          ariaLabel="합계 조회 기간"
          placeholder="합계 조회 기간 선택"
          value={range}
          onValueChange={setRange}
        />
      </FilterBar>
      {validationError && (
        <p role="alert" className="text-caption-web text-status-danger-fg">
          {validationError}
        </p>
      )}
      <DataTable
        columns={columns}
        columnSettings={columnSettings}
        density={density}
        resizableColumns
        stickyHeaderOffset={0}
        scrollMaxHeight={summary.data?.items.length ? '20rem' : undefined}
      >
        <thead>
          <tr>
            <TableHeaderCell
              columnIndex={0}
              sortDirection={summary.sortDir}
              onSortChange={summary.changeSort}
            >
              기간
            </TableHeaderCell>
            {amounts.map((item, index) => (
              <TableHeaderCell key={item.key} columnIndex={index + 1}>
                {item.label}
              </TableHeaderCell>
            ))}
          </tr>
        </thead>
        <tbody>
          {!summary.enabled ? (
            <tr>
              <TableEmpty colSpan={columns.length}>
                {ownerId
                  ? '합계 조회 기간을 확인해 주세요.'
                  : '점주 ID와 조회 기간을 입력해 주세요'}
              </TableEmpty>
            </tr>
          ) : summary.loading ? (
            <tr>
              <TableLoading colSpan={columns.length} />
            </tr>
          ) : summary.error ? (
            <tr>
              <TableError
                colSpan={columns.length}
                description={summary.error}
              />
            </tr>
          ) : !summary.data?.items.length ? (
            <tr>
              <TableEmpty colSpan={columns.length}>
                조회된 포인트 합계가 없습니다
              </TableEmpty>
            </tr>
          ) : (
            summary.data.items.map((item) => (
              <TableRow key={item.label}>
                <TableCell className="whitespace-nowrap font-medium">
                  {item.label.replaceAll('-', '.')}
                  {period === 'WEEKLY' ? ' 주' : ''}
                </TableCell>
                {amounts.map(({ key }) => (
                  <TableCell
                    key={key}
                    className="whitespace-nowrap tabular-nums"
                  >
                    {formatPoints(item[key])}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </tbody>
      </DataTable>
    </section>
  );
};
