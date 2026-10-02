import { useState } from 'react';
import { DateRangePicker, type DateRangeValue, StatusBadge } from '@repo/ui';
import { formatDate, formatPoints } from '@repo/utils';

import {
  DataTable,
  TableCell,
  TableHeaderCell,
  TableRow,
} from '@admin/components/DataTable/DataTable';

import {
  aggregateLedger,
  type DailyCache,
  getSalesReport,
} from './billingData';
import { BillingTable } from './BillingTable';
import {
  type BillingRecord,
  type BillingTabProps,
  cell,
  getMonthRange,
} from './billingView';
interface SalesOverviewTabProps extends BillingTabProps {
  dailyCache: DailyCache[];
}
const columns = [
  { label: '일자', width: 18 },
  { label: '충전액', width: 13 },
  { label: '소진액', width: 13 },
  { label: '조정액', width: 13 },
  { label: '환불액', width: 13 },
  { label: '미소진 잔액', width: 16 },
  { label: '집계 상태', width: 14 },
];
// 첫 셀은 날짜 필드와 좌우 패딩만 확보하고, 금액 열은 남은 공간을 균등하게 나눈다.
const summaryDateColumnWidth = 'calc(216px + var(--space-6) + var(--space-4))';
const summaryAmountColumnWidth = `calc((100% - ${summaryDateColumnWidth}) / 5)`;
const summaryColumns = [
  { label: '조회 기간', width: summaryDateColumnWidth },
  { label: '충전액 합계', width: summaryAmountColumnWidth },
  { label: '소진액 합계', width: summaryAmountColumnWidth },
  { label: '조정액 합계', width: summaryAmountColumnWidth },
  { label: '환불액 합계', width: summaryAmountColumnWidth },
  { label: '미소진 잔액 합계', width: summaryAmountColumnWidth },
];
export const SalesOverviewTab = ({
  state,
  today,
  dailyCache,
  preferences,
}: SalesOverviewTabProps) => {
  const [summaryRange, setSummaryRange] = useState<DateRangeValue>(() =>
    getMonthRange(today),
  );
  const previousDay = new Date(today + 'T00:00:00Z');
  previousDay.setUTCDate(previousDay.getUTCDate() - 1);
  // 당일은 집계 중이므로 기간 합계도 일별 목록의 집계 완료일까지만 포함한다.
  const summaryEnd =
    summaryRange.endDate && summaryRange.endDate < today
      ? summaryRange.endDate
      : previousDay.toISOString().slice(0, 10);
  const hasCompletedPeriod =
    !summaryRange.startDate || summaryRange.startDate <= summaryEnd;
  const summary = aggregateLedger(
    state.ledger,
    summaryRange.startDate,
    summaryEnd,
  );
  const summaryAmounts = [
    summary.charge,
    summary.spend,
    summary.adjustment,
    summary.refund,
    summary.unspent,
  ];
  const reports = getSalesReport(
    state.ledger,
    dailyCache,
    'day',
    '',
    '',
    today,
  );
  const mismatchCount = reports.reduce(
    (sum, row) => sum + row.mismatchCount,
    0,
  );
  const rows: BillingRecord[] = reports.map((item) => {
    const pendingOnly = item.pending;
    const metric = (amount: number) =>
      cell(pendingOnly ? '—' : formatPoints(amount), amount);
    return {
      id: item.key,
      date: item.key,
      status: '',
      ownerId: '',
      search: item.key,
      cells: [
        cell(formatDate(item.key), item.key),
        metric(item.charge),
        metric(item.spend),
        metric(item.adjustment),
        metric(item.refund),
        metric(item.unspent),
        cell(
          <StatusBadge
            variant={
              item.mismatchCount
                ? 'danger'
                : item.pending
                  ? 'warning'
                  : 'success'
            }
          >
            {item.mismatchCount
              ? '불일치 ' + item.mismatchCount + '건'
              : item.pending
                ? '집계 중'
                : '집계 완료'}
          </StatusBadge>,
          item.mismatchCount,
        ),
      ],
    };
  });
  return (
    <>
      <section
        className="relative z-20 space-y-3"
        aria-label="조회 기간별 매출 합계"
      >
        <h3 className="text-body-sm-web font-semibold">기간별 합계</h3>
        <DataTable
          aria-label="기간별 매출 합계"
          className="table-fixed"
          columns={summaryColumns.map((column) => ({
            width: column.width,
          }))}
          density={preferences.density}
          resizableColumns
        >
          <thead>
            <tr>
              {summaryColumns.map((column, index) => (
                <TableHeaderCell key={column.label} columnIndex={index}>
                  {column.label}
                </TableHeaderCell>
              ))}
            </tr>
          </thead>
          <tbody>
            <TableRow>
              {/* 달력 팝업이 셀의 말줄임 영역과 아래 일별 테이블에 가려지지 않도록 한다. */}
              <TableCell
                className="relative z-20"
                style={{ overflow: 'visible' }}
              >
                <div className="w-[216px]">
                  <DateRangePicker
                    ariaLabel="합계 조회 기간"
                    placeholder="전체 기간"
                    value={summaryRange}
                    onValueChange={setSummaryRange}
                  />
                </div>
              </TableCell>
              {summaryAmounts.map((amount, index) => (
                <TableCell key={summaryColumns[index + 1].label}>
                  {hasCompletedPeriod ? formatPoints(amount) : '—'}
                </TableCell>
              ))}
            </TableRow>
          </tbody>
        </DataTable>
        <p className="text-caption-web text-text-secondary">
          {hasCompletedPeriod
            ? '오늘 데이터는 집계 중이므로 합계에서 제외됩니다.'
            : '선택한 기간에 집계 완료된 날짜가 없습니다.'}{' '}
          미소진 잔액은 마지막 집계 완료일의 잔액이며, 일별 잔액을 합산하지
          않습니다.
        </p>
      </section>
      {mismatchCount > 0 && (
        <p
          role="status"
          className="rounded-lg bg-status-warning-bg p-3 text-caption-web text-status-warning-fg"
        >
          집계 응답과 원장이 다른 완료일 {mismatchCount}건이 있습니다. 원장
          합계로 표시합니다.
        </p>
      )}
      <section
        className="relative z-0 flex flex-col gap-3"
        aria-label="일별 매출 내역"
      >
        <h3 className="text-body-sm-web font-semibold">일별 내역</h3>
        <BillingTable
          preferences={preferences}
          columns={columns}
          rows={rows}
          showSearch={false}
          showDateRange={false}
        />
      </section>
    </>
  );
};
