import { useState } from 'react';
import { StatusBadge, type StatusBadgeVariant } from '@repo/ui';
import { formatDateTime, formatPoints, formatWon } from '@repo/utils';

import { AdminDrawer } from '@admin/components/AdminDrawer/AdminDrawer';
import type { PaymentStatus } from '@admin/features/billing/billingTypes';
import { paymentStatusLabels } from '@admin/features/billing/billingUtils';
import {
  type BillingTabProps,
  cell,
} from '@admin/features/billing/billingView';
import { DetailItem } from '@admin/features/billing/components/BillingDetails';
import { BillingTable } from '@admin/features/billing/components/BillingTable';
const paymentVariants: Record<PaymentStatus, StatusBadgeVariant> = {
  PENDING: 'warning',
  SUCCESS: 'success',
  FAILED: 'danger',
  CANCELED: 'danger',
  UNKNOWN: 'warning',
};

const columns = [
  { label: '결제 ID', width: 16 },
  { label: '점주 ID', width: 16 },
  { label: '결제 금액', width: 16 },
  { label: '충전 포인트', width: 16 },
  { label: '상태', width: 16 },
  { label: '결제 시각', width: 20 },
];
export const PaymentHistoryTab = (props: BillingTabProps) => {
  const { state } = props;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const selectedPayment = state.payments.find((item) => item.id === selectedId);
  const rows = state.payments.map((item) => ({
    id: item.id,
    date: item.paidAt,
    status: item.status,
    ownerId: item.ownerId,
    search: item.id + ' ' + item.ownerId,
    cells: [
      cell(item.id, item.id),
      cell(item.ownerId, item.ownerId),
      cell(formatWon(item.amount), item.amount),
      cell(formatPoints(item.points), item.points),
      cell(
        <StatusBadge variant={paymentVariants[item.status]}>
          {paymentStatusLabels[item.status]}
        </StatusBadge>,
        item.status,
      ),
      cell(formatDateTime(item.paidAt), item.paidAt),
    ],
  }));
  return (
    <>
      <BillingTable
        preferences={props.preferences}
        columns={columns}
        rows={rows}
        statusOptions={Object.entries(paymentStatusLabels)}
        onRowClick={(id) => {
          setSelectedId(id);
          setDetailOpen(true);
        }}
      />
      <AdminDrawer
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        title="결제 상세"
        resizable
      >
        {selectedPayment && (
          <div className="space-y-5">
            <StatusBadge variant={paymentVariants[selectedPayment.status]}>
              {paymentStatusLabels[selectedPayment.status]}
            </StatusBadge>
            <dl>
              <DetailItem label="결제 ID">{selectedPayment.id}</DetailItem>
              <DetailItem label="점주 ID">{selectedPayment.ownerId}</DetailItem>
              <DetailItem label="결제 금액">
                {formatWon(selectedPayment.amount)}
              </DetailItem>
              <DetailItem label="충전 포인트">
                {formatPoints(selectedPayment.points)}
              </DetailItem>
              <DetailItem label="결제 시각">
                {formatDateTime(selectedPayment.paidAt)}
              </DetailItem>
              {selectedPayment.status !== 'SUCCESS' && (
                <>
                  <DetailItem label="실패 사유">
                    {selectedPayment.failureReason || '—'}
                  </DetailItem>
                  <DetailItem label="취소 ID">
                    {selectedPayment.cancellationId || '—'}
                  </DetailItem>
                </>
              )}
            </dl>
            {selectedPayment.status === 'UNKNOWN' && (
              <div className="space-y-3 rounded-lg bg-status-warning-bg p-4">
                <p className="text-body-sm-web text-status-warning-fg">
                  결제 결과가 아직 확정되지 않았습니다. 상태 확인과 갱신은
                  서버에서 처리하며, 관리자는 조회만 할 수 있습니다.
                </p>
              </div>
            )}
          </div>
        )}
      </AdminDrawer>
    </>
  );
};
