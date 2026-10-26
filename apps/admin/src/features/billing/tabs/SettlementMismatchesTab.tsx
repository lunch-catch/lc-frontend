import { useState } from 'react';
import { Button, SelectField, StatusBadge } from '@repo/ui';
import { formatDate, formatDateTime, formatPoints } from '@repo/utils';
import {
  ArrowRight,
  ArrowRightLeft,
  Check,
  SlidersHorizontal,
} from 'lucide-react';

import {
  getSettlementMismatches,
  type SettlementMismatch,
} from '@admin/api/settlementMismatches';
import { useUrlFilters } from '@admin/hooks/useUrlFilters';
import { AdminDrawer } from '@admin/ui/AdminDrawer/AdminDrawer';
import { AdminModal } from '@admin/ui/AdminModal/AdminModal';
import { AdminDateRangePicker } from '@admin/ui/DatePicker/AdminDateRangePicker';

import {
  getBillingRangeError,
  mismatchGuidance,
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
  const [editingStatus, setEditingStatus] = useState(false);
  const nextResolved = selected?.resolutionType === null;
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
          if (!adjusting && !editingStatus) setSelected(null);
        }}
        title="정산 불일치 상세"
        resizable
      >
        {selected && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                aria-label={`${selected.resolutionType ? '해결됨' : '미해결'} 상태 변경`}
                aria-haspopup="dialog"
                className="inline-flex items-center gap-1 rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary"
                onClick={() => {
                  setEditingStatus(true);
                }}
              >
                <StatusBadge
                  variant={selected.resolutionType ? 'neutral' : 'warning'}
                >
                  {selected.resolutionType ? '해결됨' : '미해결'}
                </StatusBadge>
                <ArrowRightLeft
                  aria-hidden="true"
                  className="size-4 text-text-secondary"
                />
              </button>
              {!selected.resolutionType && (
                <div className="ml-auto flex flex-wrap justify-end gap-2">
                  {selected.checkType === 'CAMPAIGN_SPEND_VS_LEDGER' && (
                    <Button
                      leadingIcon={
                        <Check aria-hidden="true" className="size-4" />
                      }
                      onClick={() => setEditingStatus(true)}
                    >
                      조정 없이 종결
                    </Button>
                  )}
                  <Button
                    variant={
                      selected.checkType === 'CAMPAIGN_SPEND_VS_LEDGER'
                        ? 'neutral'
                        : 'primary'
                    }
                    leadingIcon={
                      <SlidersHorizontal
                        aria-hidden="true"
                        className="size-4"
                      />
                    }
                    disabled={selected.ownerId === null}
                    onClick={() => setAdjusting(true)}
                  >
                    포인트 조정으로 정정
                  </Button>
                </div>
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

            {/* 포인트 변동 상세처럼 핵심 금액을 위에, 비교값을 구분선 아래에 배치한다. */}
            <section
              aria-label="금액 비교"
              className="rounded-lg border border-border-subtle bg-bg-surface p-4"
            >
              <h3 className="text-caption-web text-text-secondary">
                차액 · 실제 금액 − 기준 금액
              </h3>
              <p className="mt-2 break-words text-3xl font-semibold tabular-nums text-text-primary">
                {selected.diff > 0 ? '+' : ''}
                {formatPoints(selected.diff)}
              </p>
              <div className="mt-3 border-t border-border-subtle pt-3">
                <h4 className="mb-1 text-caption-web text-text-secondary">
                  기준 금액 / 실제 금액
                </h4>
                <div className="flex flex-wrap items-center gap-2 text-body-sm-web tabular-nums">
                  <span className="min-w-0 break-words font-medium">
                    <span className="sr-only">기준 금액 </span>
                    {formatPoints(selected.expectedValue)}
                  </span>
                  <ArrowRight
                    aria-hidden="true"
                    className="size-4 shrink-0 text-text-tertiary"
                  />
                  <span className="min-w-0 break-words font-semibold">
                    <span className="sr-only">실제 금액 </span>
                    {formatPoints(selected.actualValue)}
                  </span>
                </div>
              </div>
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
                  {mismatchGuidance[selected.checkType]}
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
        {selected && editingStatus && (
          <AdminModal
            open
            title={
              nextResolved ? '조정 없이 종결할까요?' : '미해결로 되돌릴까요?'
            }
            onClose={() => setEditingStatus(false)}
          >
            <div className="space-y-4 p-5">
              <div className="flex items-center justify-center gap-4 rounded-lg border border-border-subtle px-4 py-5">
                <StatusBadge
                  variant={selected.resolutionType ? 'neutral' : 'warning'}
                >
                  {selected.resolutionType ? '해결됨' : '미해결'}
                </StatusBadge>
                <ArrowRight
                  aria-hidden="true"
                  className="size-4 text-text-secondary"
                />
                <StatusBadge variant={nextResolved ? 'neutral' : 'warning'}>
                  {nextResolved ? '해결됨' : '미해결'}
                </StatusBadge>
              </div>
              <p className="text-body-sm-web text-text-secondary">
                {nextResolved
                  ? '포인트 지급·차감이 필요 없는 내역을 조정 없이 종결합니다.'
                  : '다시 확인할 수 있도록 내역을 미해결 상태로 되돌립니다.'}{' '}
                상태 변경은 포인트 잔액을 바꾸거나 이전 조정을 취소하지
                않습니다.
              </p>
              <dl>
                <DetailItem label="불일치 ID" compact>
                  {selected.mismatchId}
                </DetailItem>
                {nextResolved && (
                  <DetailItem label="해결 방식" compact>
                    {resolutionLabels.NO_ADJUSTMENT_REQUIRED}
                  </DetailItem>
                )}
              </dl>
              {/* UI 미리보기 단계: API 연결 전에는 서버 상태나 성공 안내를 변경하지 않는다. */}
              <p role="status" className="text-caption-web text-text-secondary">
                현재는 화면 미리보기입니다. 변경한 상태는 저장되지 않습니다.
              </p>
              <div className="flex justify-end gap-2">
                <Button
                  variant="neutral"
                  onClick={() => setEditingStatus(false)}
                >
                  취소
                </Button>
                <Button onClick={() => setEditingStatus(false)}>
                  {nextResolved ? '조정 없이 종결' : '미해결로 변경'}
                </Button>
              </div>
            </div>
          </AdminModal>
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
