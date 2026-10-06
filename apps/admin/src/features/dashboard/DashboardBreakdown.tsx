import { useState } from 'react';
import { SegmentedControl } from '@repo/ui';
import { formatNumber } from '@repo/utils';

import {
  DataTable,
  TableCell,
  TableHeaderCell,
  TableRow,
} from '@admin/components/DataTable/DataTable';

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
      description="열 제목을 눌러 이용량 순으로 정렬하고, 사용 건수의 이전 기간 대비 변화를 확인하세요."
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
      <div className="overflow-x-auto">
        <DataTable
          aria-label={`${dimension === 'region' ? '지역' : '카테고리'}별 이용 현황`}
        >
          <thead>
            <tr>
              {[
                {
                  value: 'name',
                  label: dimension === 'region' ? '지역' : '카테고리',
                },
                ...usageMetrics,
              ].map((column) => (
                <TableHeaderCell
                  key={column.value}
                  onSortChange={() =>
                    changeSort(column.value as UsageMetric | 'name')
                  }
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
              rows.map((row) => (
                <TableRow key={row.name}>
                  <TableCell>{row.name}</TableCell>
                  {usageMetrics.map((metric) => (
                    <TableCell key={metric.value}>
                      {formatNumber(row[metric.value])}건
                    </TableCell>
                  ))}
                  <TableCell>
                    {canCompare
                      ? getChangeLabel(row.used, previous.get(row.name) ?? 0)
                      : '비교 집계 없음'}
                  </TableCell>
                </TableRow>
              ))
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
