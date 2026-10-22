import { useState } from 'react';
import { SearchField, SelectField, StatusBadge } from '@repo/ui';
import { formatDateTime, formatPoints } from '@repo/utils';

import { type AdminRefund, getRefunds } from '@admin/api/refunds';
import { useUrlFilters } from '@admin/hooks/useUrlFilters';
import { useUrlSearch } from '@admin/hooks/useUrlSearch';
import { AdminDrawer } from '@admin/ui/AdminDrawer/AdminDrawer';
import { AdminDateRangePicker } from '@admin/ui/DatePicker/AdminDateRangePicker';

import {
  getBillingRangeError,
  isBillingInputId,
  refundStatusLabels,
  refundVariants,
} from '../billingManagementUtils';
import { refundQuery } from '../billingQuery';
import type { BillingTablePreferences } from '../billingView';
import {
  type BillingServerColumn,
  BillingServerTable,
} from '../ui/BillingServerTable';
import { RefundDetails } from '../ui/RefundDetails';
import { useBillingResource } from '../useBillingResource';

const columns: BillingServerColumn<AdminRefund>[] = [
  {
    key: 'requestedAt',
    label: '요청 시각',
    width: '18%',
    minWidth: 160,
    sortable: true,
    render: (item) => formatDateTime(item.requestedAt),
  },
  {
    key: 'refundRequestId',
    label: '요청 ID',
    width: '10%',
    minWidth: 90,
    render: (item) => item.refundRequestId,
  },
  {
    key: 'ownerId',
    label: '점주 ID',
    width: '10%',
    minWidth: 90,
    render: (item) => item.ownerId,
  },
  {
    key: 'amount',
    label: '요청 포인트',
    width: '16%',
    minWidth: 120,
    align: 'right',
    sortable: true,
    render: (item) => formatPoints(item.amount),
  },
  {
    key: 'status',
    label: '상태',
    width: '14%',
    minWidth: 110,
    render: (item) => (
      <StatusBadge variant={refundVariants[item.status]}>
        {refundStatusLabels[item.status]}
      </StatusBadge>
    ),
  },
  {
    key: 'processedBy',
    label: '처리자 ID',
    width: '12%',
    minWidth: 100,
    render: (item) => item.processedBy ?? '—',
  },
  {
    key: 'processedAt',
    label: '처리 시각',
    width: '20%',
    minWidth: 160,
    sortable: true,
    render: (item) =>
      item.processedAt ? formatDateTime(item.processedAt) : '—',
  },
];
export const RefundRequestsTab = ({
  preferences,
}: {
  preferences: BillingTablePreferences;
}) => {
  const { filters, updateFilters } = useUrlFilters('refunds.', refundQuery);
  const [selected, setSelected] = useState<AdminRefund | null>(null);
  const [notice, setNotice] = useState('');
  const search = useUrlSearch(filters.ownerId, (ownerId) => {
    updateFilters({ ownerId, page: 1 });
    setSelected(null);
  });
  const owner = search.keyword.trim();
  const pending = search.draftKeyword !== search.keyword;
  const validation =
    getBillingRangeError(filters.from, filters.to) ||
    (owner && !isBillingInputId(owner)
      ? '점주 ID를 양의 정수로 입력해 주세요.'
      : '');
  const query = new URLSearchParams({
    page: String(filters.page - 1),
    size: String(filters.size),
    sortBy: filters.sortBy,
    sortDir: filters.sortDir,
  });
  if (owner) query.set('ownerId', String(Number(owner)));
  if (filters.status !== 'ALL') query.set('status', filters.status);
  if (filters.from) query.set('from', filters.from);
  if (filters.to) query.set('to', filters.to);
  const resource = useBillingResource(
    getRefunds,
    !pending && !validation ? query.toString() : null,
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
        tableId="billing.refunds"
        columns={columns}
        items={resource.data?.items ?? []}
        rowId={(item) => item.refundRequestId}
        loading={resource.loading || pending}
        error={validation || resource.error}
        onRetry={!validation ? resource.refresh : undefined}
        emptyMessage="조회된 환불 요청이 없습니다."
        preferences={preferences}
        page={filters.page}
        size={filters.size}
        total={resource.data?.totalElements ?? 0}
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
          setNotice('');
          setSelected(item);
        }}
        filters={
          <>
            <SearchField
              aria-label="환불 점주 ID"
              placeholder="점주 ID를 입력하세요"
              inputMode="numeric"
              value={search.draftKeyword}
              onChange={(event) => search.setDraftKeyword(event.target.value)}
            />
            <SelectField
              fitContent
              aria-label="환불 상태"
              value={filters.status}
              options={[
                { label: '상태 전체', value: 'ALL' },
                ...Object.entries(refundStatusLabels).map(([value, label]) => ({
                  value,
                  label,
                })),
              ]}
              onValueChange={(value) =>
                update({ status: value as typeof filters.status })
              }
            />
            <AdminDateRangePicker
              ariaLabel="환불 요청일 범위"
              placeholder="요청일 범위 선택"
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
        onClose={() => setSelected(null)}
        title="환불 요청 상세"
        resizable
      >
        {selected && (
          <RefundDetails
            key={selected.refundRequestId}
            refund={selected}
            onRefresh={resource.refresh}
            onCompleted={(message) => {
              setSelected(null);
              setNotice(message);
              updateFilters({ page: 1 }, true);
              resource.refresh();
            }}
          />
        )}
      </AdminDrawer>
    </>
  );
};
