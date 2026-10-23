import { useState } from 'react';
import { Button, SelectField, StatusBadge } from '@repo/ui';
import { formatDate, formatDateTime, formatPoints } from '@repo/utils';

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

// 기본 정렬(createdAt 내림차순)에 맞춰 발견 시각을 첫 열에 표시한다.
const columns: BillingServerColumn<SettlementMismatch>[] = [
  {
    key: 'createdAt',
    label: '발견 시각',
    width: '13%',
    minWidth: 170,
    sortable: true,
    render: (item) => formatDateTime(item.createdAt),
  },
  {
    key: 'businessDate',
    label: '대상 영업일',
    width: '12%',
    minWidth: 120,
    sortable: true,
    render: (item) => formatDate(item.businessDate),
  },
  {
    key: 'mismatchId',
    label: '불일치 ID',
    width: '8%',
    minWidth: 100,
    render: (item) => item.mismatchId,
  },
  {
    key: 'checkType',
    label: '검증 종류',
    width: '18%',
    minWidth: 200,
    render: (item) => mismatchLabels[item.checkType],
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
    width: '11%',
    minWidth: 115,
    align: 'right',
    render: (item) => formatPoints(item.expectedValue),
  },
  {
    key: 'actualValue',
    label: '실제 금액',
    width: '11%',
    minWidth: 115,
    align: 'right',
    render: (item) => formatPoints(item.actualValue),
  },
  {
    key: 'diff',
    label: '차액',
    width: '10%',
    minWidth: 110,
    align: 'right',
    render: (item) => formatPoints(item.diff),
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
        heading="정산 불일치 내역"
        description="차액은 실제 금액에서 기준 금액을 뺀 값입니다. 대상 ID는 검증 종류에 따라 결제 ID 또는 캠페인 ID입니다."
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
        total={resource.data?.totalElements}
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
          <div className="space-y-5">
            <StatusBadge
              variant={selected.resolutionType ? 'neutral' : 'warning'}
            >
              {selected.resolutionType ? '해결됨' : '미해결'}
            </StatusBadge>
            <dl>
              <DetailItem label="불일치 ID" compact>
                {selected.mismatchId}
              </DetailItem>
              <DetailItem label="검증 종류" compact>
                {mismatchLabels[selected.checkType]}
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
              <DetailItem label="대상 영업일" compact>
                {formatDate(selected.businessDate)}
              </DetailItem>
              <DetailItem label="기준 금액" compact>
                {formatPoints(selected.expectedValue)}
              </DetailItem>
              <DetailItem label="실제 금액" compact>
                {formatPoints(selected.actualValue)}
              </DetailItem>
              <DetailItem label="차액" compact>
                {formatPoints(selected.diff)}
              </DetailItem>
              <DetailItem label="발견 시각" compact>
                {formatDateTime(selected.createdAt)}
              </DetailItem>
              <DetailItem label="배치 실행 ID" compact>
                {selected.jobExecutionId ?? '—'}
              </DetailItem>
              <DetailItem label="해결 방식" compact>
                {selected.resolutionType
                  ? resolutionLabels[selected.resolutionType]
                  : '—'}
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
            {!selected.resolutionType && (
              <div className="space-y-3">
                <p className="text-caption-web text-text-secondary">
                  과도하게 차감된 포인트를 돌려주는 경우 정정할 수 있습니다.
                  조정 대상 점주는 별도로 확인해 입력해 주세요.
                </p>
                <Button onClick={() => setAdjusting(true)}>
                  포인트 조정으로 정정
                </Button>
              </div>
            )}
          </div>
        )}
        {selected && adjusting && (
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
