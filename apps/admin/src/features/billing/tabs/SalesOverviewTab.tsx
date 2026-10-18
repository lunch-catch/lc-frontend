import {
  Button,
  DateRangePicker,
  SegmentedControl,
  StatusBadge,
} from '@repo/ui';
import { formatDateTime, formatPoints, formatWon } from '@repo/utils';

import { getSales } from '@admin/api/analytics';
import {
  getAnalyticsRangeError,
  shiftDate,
} from '@admin/features/analytics/analyticsDateUtils';
import {
  analyticsPeriods,
  sumAnalytics,
} from '@admin/features/analytics/analyticsUtils';
import { useAnalyticsQuery } from '@admin/features/analytics/useAnalyticsQuery';
import { queryChoice, queryDate } from '@admin/hooks/urlQuery';
import { useUrlFilters } from '@admin/hooks/useUrlFilters';
import {
  DataTable,
  TableCell,
  TableHeaderCell,
  TableRow,
} from '@admin/ui/DataTable';

import type {
  BillingColumn,
  BillingRecord,
  BillingTablePreferences,
} from '../billingView';
import { cell } from '../billingView';
import { BillingTable } from '../components/BillingTable';

const amountFields = [
  'chargeAmount',
  'spentAmount',
  'adjustAmount',
  'refundAmount',
  'unspentBalance',
] as const;
const formatAmount = (field: (typeof amountFields)[number], value: number) =>
  field === 'chargeAmount' || field === 'refundAmount'
    ? formatWon(value)
    : formatPoints(value);
const columns: BillingColumn[] = [
  { label: '기간', width: 18 },
  ...['충전액', '소진액', '조정액', '환불액', '미소진 잔액'].map((label) => ({
    label,
    width: 14,
    align: 'right' as const,
  })),
  { label: '집계 상태', width: 12 },
];
export const SalesOverviewTab = ({
  today,
  preferences,
}: {
  today: string;
  preferences: BillingTablePreferences;
}) => {
  const { filters, updateFilters } = useUrlFilters('sales.', {
    from: queryDate(shiftDate(today, -1).slice(0, 7) + '-01'),
    to: queryDate(shiftDate(today, -1)),
    period: queryChoice(['day', 'week', 'month'] as const, 'day'),
  });
  const range = { startDate: filters.from, endDate: filters.to };
  const validation = getAnalyticsRangeError(range, filters.period);
  const resource = useAnalyticsQuery(
    getSales,
    validation
      ? null
      : {
          period: analyticsPeriods[filters.period],
          from: filters.from,
          to: filters.to,
        },
  );
  const data = resource.data;
  // 잔액은 마지막 구간의 값이며 발생량처럼 여러 날짜를 더하지 않는다.
  const totals = [
    ...amountFields.slice(0, 4).map((field) => sumAnalytics(data, field)),
    data?.items.at(-1)?.unspentBalance ?? null,
  ];
  const pending = data?.items.some((item) => item.status === 'IN_PROGRESS');
  const rows: BillingRecord[] = (data?.items ?? []).map((item) => ({
    id: item.label,
    date: item.label,
    status: item.status,
    search: item.label,
    cells: [
      cell(item.label, item.label),
      ...amountFields.map((field) =>
        cell(
          item[field] === null ? '—' : formatAmount(field, item[field]),
          item[field] ?? '',
        ),
      ),
      cell(
        <StatusBadge variant={item.status === 'FINAL' ? 'success' : 'warning'}>
          {item.status === 'FINAL' ? '집계 완료' : '집계 중'}
        </StatusBadge>,
        item.status,
      ),
    ],
  }));
  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <SegmentedControl
          ariaLabel="매출 집계 단위"
          value={filters.period}
          items={[
            { label: '일별', value: 'day' },
            { label: '주별', value: 'week' },
            { label: '월별', value: 'month' },
          ]}
          onValueChange={(period) => updateFilters({ period })}
        />
        <DateRangePicker
          ariaLabel="매출 조회 기간"
          placeholder="조회 기간 선택"
          selectionMode={filters.period}
          value={range}
          onValueChange={(value) =>
            updateFilters({ from: value.startDate, to: value.endDate })
          }
        />
        <span className="text-caption-web text-text-secondary">
          마지막 집계{' '}
          {data?.aggregatedAt ? formatDateTime(data.aggregatedAt) : '—'}
        </span>
      </div>
      {validation && (
        <p role="alert" className="text-body-sm-web text-status-danger-fg">
          {validation}
        </p>
      )}
      {resource.error && (
        <div
          role="alert"
          className="flex items-center gap-3 text-body-sm-web text-status-danger-fg"
        >
          {resource.error}
          <Button variant="neutral" onClick={resource.retry}>
            다시 시도
          </Button>
        </div>
      )}
      <section aria-label="조회 기간별 매출 합계" className="space-y-3">
        <h3 className="text-body-sm-web font-semibold">기간별 합계</h3>
        <DataTable
          aria-label="기간별 매출 합계"
          density={preferences.density}
          className="table-fixed"
          columns={columns.slice(1, 6).map(() => ({ align: 'right' as const }))}
        >
          <thead>
            <tr>
              {columns.slice(1, 6).map((column, index) => (
                <TableHeaderCell key={column.label} columnIndex={index}>
                  {column.label}
                </TableHeaderCell>
              ))}
            </tr>
          </thead>
          <tbody>
            <TableRow>
              {totals.map((value, index) => (
                <TableCell key={amountFields[index]}>
                  {value === null
                    ? '—'
                    : formatAmount(amountFields[index], value)}
                </TableCell>
              ))}
            </TableRow>
          </tbody>
        </DataTable>
        <p className="text-caption-web text-text-secondary">
          {resource.loading
            ? '집계 데이터를 불러오는 중입니다.'
            : pending
              ? '미확정 구간이 포함되어 기간 합계를 표시하지 않습니다.'
              : '미소진 잔액은 조회 기간 마지막 구간의 값이며 일별 잔액을 합산하지 않습니다.'}
        </p>
      </section>
      <section aria-label="매출 내역" className="space-y-3">
        <h3 className="text-body-sm-web font-semibold">기간별 내역</h3>
        <BillingTable
          queryPrefix="sales.table."
          preferences={preferences}
          columns={columns}
          rows={rows}
          showSearch={false}
          showDateRange={false}
          loading={resource.loading}
          error={validation || resource.error}
        />
      </section>
    </>
  );
};
