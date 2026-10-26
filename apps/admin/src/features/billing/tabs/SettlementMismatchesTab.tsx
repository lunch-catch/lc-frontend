import { useState } from 'react';
import { Button, SelectField, StatusBadge } from '@repo/ui';
import { formatDate, formatDateTime, formatPoints } from '@repo/utils';
import { SlidersHorizontal } from 'lucide-react';

import {
  getSettlementMismatches,
  type SettlementMismatch,
} from '@admin/api/settlementMismatches';
import { useUrlFilters } from '@admin/hooks/useUrlFilters';
import { AdminDrawer } from '@admin/ui/AdminDrawer/AdminDrawer';
import { AdminDateRangePicker } from '@admin/ui/DatePicker/AdminDateRangePicker';

import {
  getBillingRangeError,
  mismatchLabels,
  resolutionLabels,
} from '../billingManagementUtils';
import { mismatchQuery } from '../billingQuery';
import type { BillingTablePreferences } from '../billingView';
import { DetailItem } from '../ui/BillingDetails';
import {
  type BillingServerColumn,
  BillingServerTable,
} from '../ui/BillingServerTable';
import { PointAdjustmentModal } from '../ui/PointAdjustmentModal';
import { useBillingResource } from '../useBillingResource';

// 기본 정렬인 발견 시각 뒤에 처리 상태·대상·금액 비교를 두고 추적용 불일치 ID는 마지막에 둔다.
const columns: BillingServerColumn<SettlementMismatch>[] = [
  {
    key: 'createdAt',
    label: '발견 시각',
    width: '12%',
    minWidth: 170,
    sortable: true,
    render: (item) => formatDateTime(item.createdAt),
  },
  {
    key: 'resolutionType',
    label: '처리 상태',
    width: '9%',
    minWidth: 100,
    render: (item) => (
      <StatusBadge variant={item.resolutionType ? 'neutral' : 'warning'}>
        {item.resolutionType ? '해결됨' : '미해결'}
      </StatusBadge>
    ),
  },
  {
    key: 'businessDate',
    label: '대상 영업일',
    width: '10%',
    minWidth: 120,
    sortable: true,
    render: (item) => formatDate(item.businessDate),
  },
  {
    key: 'checkType',
    label: '검증 종류',
    width: '16%',
    minWidth: 200,
    render: (item) => mismatchLabels[item.checkType],
  },
  {
    key: 'ownerId',
    label: '점주 ID',
    width: '8%',
    minWidth: 100,
    render: (item) => item.ownerId ?? '—',
  },
  {
    key: 'targetId',
    label: '대상 ID',
    width: '8%',
    minWidth: 90,
    render: (item) => item.targetId,
  },
  {
    key: 'expectedValue',
    label: '기준 금액',
    width: '10%',
    minWidth: 115,
    align: 'right',
    render: (item) => formatPoints(item.expectedValue),
  },
  {
    key: 'actualValue',
    label: '실제 금액',
    width: '10%',
    minWidth: 115,
    align: 'right',
    render: (item) => formatPoints(item.actualValue),
  },
  {
    key: 'diff',
    label: '차액',
    width: '9%',
    minWidth: 110,
    align: 'right',
    render: (item) => formatPoints(item.diff),
  },
  {
    key: 'mismatchId',
    label: '불일치 ID',
    width: '8%',
    minWidth: 100,
    render: (item) => item.mismatchId,
  },
];

export const SettlementMismatchesTab = ({
  preferences,
}: {
  preferences: BillingTablePreferences;
}) => {
  const { filters, updateFilters } = useUrlFilters(
    'mismatches.',
    mismatchQuery,
  );
  const [selected, setSelected] = useState<SettlementMismatch | null>(null);
  const [adjusting, setAdjusting] = useState(false);
  const [notice, setNotice] = useState('');
  const validation = getBillingRangeError(filters.from, filters.to);
  const query = new URLSearchParams({
    page: String(filters.page - 1),
    size: String(filters.size),
    sortBy: filters.sortBy,
    sortDir: filters.sortDir,
  });
  if (filters.checkType !== 'ALL') query.set('checkType', filters.checkType);
  if (filters.resolved !== 'ALL') query.set('resolved', filters.resolved);
  if (filters.from) query.set('from', filters.from);
  if (filters.to) query.set('to', filters.to);
  const resource = useBillingResource(
    getSettlementMismatches,
    validation ? null : query.toString(),
  );
  const update = (patch: Partial<typeof filters>) => {
    updateFilters({ ...patch, page: 1 });
    setSelected(null);
    setNotice('');
  };
  return (
    <>
      {notice && (
        <p role="status" className="text-body-sm-web text-text-secondary">
          {notice}
        </p>
      )}
      <BillingServerTable
        tableId="billing.settlementMismatches"
        columns={columns}
        items={resource.data?.items ?? []}
        rowId={(item) => item.mismatchId}
        loading={resource.loading}
        error={validation || resource.error}
        onRetry={!validation ? resource.refresh : undefined}
        emptyMessage="조회된 정산 불일치 내역이 없습니다."
        preferences={preferences}
        page={filters.page}
        size={filters.size}
        total={resource.totalCount}
        onPageChange={(page) => {
          updateFilters({ page });
          setSelected(null);
        }}
        onSizeChange={(size) => update({ size })}
        sort={{ key: filters.sortBy, direction: filters.sortDir }}
        onSort={(key) =>
          update({
            sortBy: key as typeof filters.sortBy,
            sortDir:
              filters.sortBy === key && filters.sortDir === 'desc'
                ? 'asc'
                : 'desc',
          })
        }
        onOpen={(item) => {
          setSelected(item);
          setNotice('');
        }}
        filters={
          <>
            <SelectField
              fitContent
              aria-label="검증 종류"
              value={filters.checkType}
              options={[
                { label: '검증 종류 전체', value: 'ALL' },
                ...Object.entries(mismatchLabels).map(([value, label]) => ({
                  value,
                  label,
                })),
              ]}
              onValueChange={(value) =>
                update({ checkType: value as typeof filters.checkType })
              }
            />
            <SelectField
              fitContent
              aria-label="정산 불일치 해결 여부"
              value={filters.resolved}
              options={[
                { label: '처리 상태 전체', value: 'ALL' },
                { label: '미해결', value: 'false' },
                { label: '해결됨', value: 'true' },
              ]}
              onValueChange={(value) =>
                update({ resolved: value as typeof filters.resolved })
              }
            />
            <AdminDateRangePicker
              ariaLabel="검증 대상 영업일 범위"
              placeholder="대상 영업일 선택"
              value={{ startDate: filters.from, endDate: filters.to }}
              onValueChange={(value) =>
                update({ from: value.startDate, to: value.endDate })
              }
            />
          </>
        }
      />
      <AdminDrawer
        open={selected !== null}
        onClose={() => {
          if (!adjusting) setSelected(null);
        }}
        title="정산 불일치 상세"
        resizable
      >
        {selected && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <StatusBadge
                variant={selected.resolutionType ? 'neutral' : 'warning'}
              >
                {selected.resolutionType ? '해결됨' : '미해결'}
              </StatusBadge>
              {!selected.resolutionType && (
                <Button
                  leadingIcon={
                    <SlidersHorizontal aria-hidden="true" className="size-4" />
                  }
                  disabled={selected.ownerId === null}
                  onClick={() => setAdjusting(true)}
                >
                  포인트 조정으로 정정
                </Button>
              )}
            </div>

            <section className="space-y-2">
              <h3 className="text-body-sm-web font-semibold text-text-primary">
                대상 정보
              </h3>
              <dl>
                <DetailItem label="불일치 유형" compact>
                  {mismatchLabels[selected.checkType]}
                </DetailItem>
                <DetailItem label="대상 영업일" compact>
                  {formatDate(selected.businessDate)}
                </DetailItem>
                <DetailItem label="점주 ID" compact>
                  {selected.ownerId ?? '—'}
                </DetailItem>
                <DetailItem
                  label={
                    selected.checkType === 'PG_VS_CHARGE'
                      ? '결제 ID'
                      : '캠페인 ID'
                  }
                  compact
                >
                  {selected.targetId}
                </DetailItem>
              </dl>
            </section>

            {/* 기준과 실제 값을 나란히 비교하고 판단에 필요한 차액을 강조한다. */}
            <section className="space-y-3">
              <h3 className="text-body-sm-web font-semibold text-text-primary">
                금액 비교
              </h3>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-4 rounded-lg border border-border-subtle bg-surface-subtle p-4">
                <div className="min-w-0 space-y-1">
                  <dt className="text-caption-web text-text-secondary">
                    기준 금액
                  </dt>
                  <dd className="break-words text-body-sm-web font-medium tabular-nums">
                    {formatPoints(selected.expectedValue)}
                  </dd>
                </div>
                <div className="min-w-0 space-y-1">
                  <dt className="text-caption-web text-text-secondary">
                    실제 금액
                  </dt>
                  <dd className="break-words text-body-sm-web font-medium tabular-nums">
                    {formatPoints(selected.actualValue)}
                  </dd>
                </div>
                <div className="col-span-2 space-y-1 border-t border-border-subtle pt-3">
                  <dt className="text-caption-web text-text-secondary">
                    차액 · 실제 금액 − 기준 금액
                  </dt>
                  <dd className="break-words text-heading-sm-web font-semibold tabular-nums text-text-primary">
                    {selected.diff > 0 ? '+' : ''}
                    {formatPoints(selected.diff)}
                  </dd>
                </div>
              </dl>
            </section>

            {selected.resolutionType ? (
              <section className="space-y-2">
                <h3 className="text-body-sm-web font-semibold text-text-primary">
                  처리 정보
                </h3>
                <dl>
                  <DetailItem label="해결 방식" compact>
                    {resolutionLabels[selected.resolutionType]}
                  </DetailItem>
                  <DetailItem label="해결 시각" compact>
                    {selected.resolvedAt
                      ? formatDateTime(selected.resolvedAt)
                      : '—'}
                  </DetailItem>
                  <DetailItem label="처리자 ID" compact>
                    {selected.resolvedBy ?? '—'}
                  </DetailItem>
                </dl>
              </section>
            ) : (
              <section className="space-y-3">
                <h3 className="text-body-sm-web font-semibold text-text-primary">
                  정정하기
                </h3>
                <p className="text-caption-web leading-relaxed text-text-secondary">
                  지급은 점주의 잔액을 늘리고, 차감은 잔액을 줄입니다. 대상
                  점주와 조정 방식·금액을 확인한 뒤 정정해 주세요.
                </p>
                {selected.ownerId === null && (
                  <p className="text-caption-web text-status-warning-fg">
                    점주 정보를 확인할 수 없어 정정할 수 없습니다.
                  </p>
                )}
              </section>
            )}

            {/* 조회·추적용 정보는 대상과 금액 비교 다음에 배치한다. */}
            <section className="space-y-2 border-t border-border-subtle pt-4">
              <h3 className="text-body-sm-web font-semibold text-text-primary">
                기록 정보
              </h3>
              <dl>
                <DetailItem label="불일치 ID" compact>
                  {selected.mismatchId}
                </DetailItem>
                <DetailItem label="발견 시각" compact>
                  {formatDateTime(selected.createdAt)}
                </DetailItem>
                <DetailItem label="배치 실행 ID" compact>
                  {selected.jobExecutionId ?? '—'}
                </DetailItem>
              </dl>
            </section>
          </div>
        )}
        {selected && selected.ownerId !== null && adjusting && (
          <PointAdjustmentModal
            mismatch={selected}
            onClose={() => setAdjusting(false)}
            onSaved={(ledgerId) => {
              setAdjusting(false);
              setSelected(null);
              setNotice(`정정을 완료했습니다. (원장 ID: ${ledgerId})`);
              updateFilters({ page: 1 }, true);
              resource.refresh();
            }}
          />
        )}
      </AdminDrawer>
    </>
  );
};
