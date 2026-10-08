import { useState } from 'react';
import { SegmentedControl } from '@repo/ui';
import { formatNumber } from '@repo/utils';

import {
  DataTable,
  TableCell,
  TableHeaderCell,
  TableRow,
} from '@admin/components/DataTable';

import { DashboardSection } from './DashboardSection';
import type {
  BreakdownDimension,
  DashboardDailyAggregate,
  UsageBreakdown,
  UsageMetric,
} from './dashboardTypes';
import { getBreakdown, getChangeLabel, usageMetrics } from './dashboardUtils';

interface DashboardBreakdownProps {
  days: DashboardDailyAggregate[];
  previousDays: DashboardDailyAggregate[];
  canCompare: boolean;
}

export const DashboardBreakdown = ({
  days,
  previousDays,
  canCompare,
}: DashboardBreakdownProps) => {
  const [dimension, setDimension] = useState<BreakdownDimension>('region');
  const [rankingMetric, setRankingMetric] = useState<UsageMetric>('used');
  const [sort, setSort] = useState<{
    key: keyof UsageBreakdown;
    direction: 'asc' | 'desc';
  } | null>({ key: 'used', direction: 'desc' });
  const rows = getBreakdown(days, dimension).sort((a, b) => {
    if (!sort) return 0;
    const result =
      sort.key === 'name'
        ? a.name.localeCompare(b.name, 'ko')
        : a[sort.key] - b[sort.key];
    return result * (sort.direction === 'asc' ? 1 : -1);
  });
  const previous = new Map(
    getBreakdown(previousDays, dimension).map((row) => [row.name, row.used]),
  );
  // 표 정렬을 바꿔도 상위 순위는 선택한 지표의 내림차순을 유지한다.
  const ranking = [...rows]
    .sort((a, b) => b[rankingMetric] - a[rankingMetric])
    .slice(0, 3);
  const rankingMax = Math.max(1, ...ranking.map((row) => row[rankingMetric]));
  const rankingLabel = usageMetrics.find(
    (item) => item.value === rankingMetric,
  )!.label;
  const columns: { value: keyof UsageBreakdown; label: string }[] = [
    { value: 'name', label: dimension === 'region' ? '지역' : '카테고리' },
    ...usageMetrics,
  ];
  const changeSort = (key: keyof UsageBreakdown) =>
    setSort(
      sort?.key === key && sort.direction === 'asc'
        ? null
        : {
            key,
            direction:
              sort?.key === key && sort.direction === 'desc' ? 'asc' : 'desc',
          },
    );
  return (
    <DashboardSection
      title="지역·카테고리별 이용 현황"
      description="이용량이 많은 곳을 비교하고, 전체 내역에서 이전 기간 대비 변화를 확인하세요."
      action={
        <SegmentedControl<BreakdownDimension>
          ariaLabel="분석 기준"
          value={dimension}
          onValueChange={setDimension}
          items={[
            { label: '지역별', value: 'region' },
            { label: '카테고리별', value: 'category' },
          ]}
        />
      }
    >
      <div className="mb-5 rounded-lg bg-bg-page p-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h4 className="text-body-sm-web font-semibold">
            {rankingLabel} 상위 {ranking.length}곳
          </h4>
          <SegmentedControl<UsageMetric>
            ariaLabel="상위 순위 지표"
            value={rankingMetric}
            onValueChange={setRankingMetric}
            items={usageMetrics}
          />
        </div>
        {ranking.length ? (
          <div className="grid gap-5 md:grid-cols-3">
            {ranking.map((row, index) => (
              <div key={row.name} className="space-y-3">
                <div className="flex items-center justify-between gap-3 text-body-sm-web">
                  <span className="flex items-center gap-2">
                    <span className="text-caption-web font-semibold text-text-brand">
                      0{index + 1}
                    </span>
                    <span className="font-medium">{row.name}</span>
                  </span>
                  <span className="font-semibold tabular-nums">
                    {formatNumber(row[rankingMetric])}
                    <span className="ml-1 text-caption-web font-normal text-text-secondary">
                      건
                    </span>
                  </span>
                </div>
                <div
                  className="h-2 overflow-hidden rounded-full bg-surface-subtle"
                  aria-hidden="true"
                >
                  <div
                    className={`h-full rounded-full ${index === 0 ? 'bg-action-primary' : 'bg-action-secondary'}`}
                    style={{
                      width: `${(row[rankingMetric] / rankingMax) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-body-sm-web text-text-secondary">
            집계된 이용 데이터가 없습니다.
          </p>
        )}
      </div>
      <p className="mb-2 text-right text-caption-web text-text-secondary">
        단위: 건 · 열 제목을 눌러 정렬
      </p>
      <div className="overflow-x-auto">
        <DataTable
          aria-label={`${dimension === 'region' ? '지역' : '카테고리'}별 이용 현황`}
        >
          <thead>
            <tr>
              {columns.map((column) => (
                <TableHeaderCell
                  key={column.value}
                  onSortChange={() => changeSort(column.value)}
                  sortDirection={
                    sort?.key === column.value ? sort.direction : undefined
                  }
                >
                  {column.label}
                </TableHeaderCell>
              ))}
              <TableHeaderCell>사용 증감률</TableHeaderCell>
            </tr>
          </thead>
          <tbody>
            {rows.length ? (
              rows.map((row) => {
                const previousUsed = previous.get(row.name) ?? 0;
                const changeDirection = canCompare
                  ? Math.sign(row.used - previousUsed)
                  : 0;
                const changeClassName =
                  changeDirection > 0
                    ? 'text-status-success-fg'
                    : changeDirection < 0
                      ? 'text-status-danger-fg'
                      : 'text-text-secondary';
                return (
                  <TableRow key={row.name}>
                    <TableCell className="font-medium">{row.name}</TableCell>
                    {usageMetrics.map((metric) => (
                      <TableCell
                        key={metric.value}
                        className={`tabular-nums ${metric.value === 'used' ? 'font-semibold' : ''}`}
                      >
                        {formatNumber(row[metric.value])}
                      </TableCell>
                    ))}
                    <TableCell className="tabular-nums">
                      <span className={changeClassName}>
                        {canCompare
                          ? getChangeLabel(row.used, previousUsed)
                          : '비교 집계 없음'}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <tr>
                <TableCell colSpan={6}>
                  <p className="py-8 text-center text-text-secondary">
                    선택한 기간에 집계된 이용 데이터가 없습니다.
                  </p>
                </TableCell>
              </tr>
            )}
          </tbody>
        </DataTable>
      </div>
    </DashboardSection>
  );
};
