import { useState } from 'react';
import { Button, Input, StatusBadge, type StatusBadgeVariant } from '@repo/ui';

import { AdminDrawer } from '@admin/components/AdminDrawer/AdminDrawer';

import {
  formatPoints,
  getBalance,
  getRefundBlockReason,
  processRefund,
  type RefundStatus,
  refundStatusLabels,
} from './billingData';
import { BillingFeedback, DetailItem } from './BillingDetails';
import { BillingTable } from './BillingTable';
import {
  type BillingTabProps,
  cell,
  currentTimestamp,
  timestamp,
  useBillingFeedback,
} from './billingView';
const refundVariants: Record<RefundStatus, StatusBadgeVariant> = {
  REQUESTED: 'warning',
  APPROVED: 'success',
  REJECTED: 'danger',
};

const columns = [
  { label: '요청 ID', width: 15 },
  { label: '점주 ID', width: 15 },
  { label: '요청 포인트', width: 17 },
  { label: '상태', width: 13 },
  { label: '처리자 ID', width: 15 },
  { label: '요청 시각', width: 25 },
];
export const RefundRequestsTab = (props: BillingTabProps) => {
  const { state, today } = props;
  const { notice, error, setError, clearFeedback, runMutation } =
    useBillingFeedback(props);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [reason, setReason] = useState('');
  const selectedRefund = state.refunds.find((item) => item.id === selectedId);
  const refundBlock = selectedRefund
    ? getRefundBlockReason(state, selectedRefund)
    : '';
  const refundBalance = selectedRefund
    ? getBalance(state.ledger, selectedRefund.ownerId)
    : null;
  const rows = state.refunds.map((item) => ({
    id: item.id,
    date: item.requestedAt,
    status: item.status,
    ownerId: item.ownerId,
    search: item.id + ' ' + item.ownerId,
    cells: [
      cell(item.id, item.id),
      cell(item.ownerId, item.ownerId),
      cell(formatPoints(item.points), item.points),
      cell(
        <StatusBadge variant={refundVariants[item.status]}>
          {refundStatusLabels[item.status]}
        </StatusBadge>,
        item.status,
      ),
      cell(item.actorId ?? '—', item.actorId ?? ''),
      cell(timestamp(item.requestedAt), item.requestedAt),
    ],
  }));
  const handleRefund = (decision: 'APPROVED' | 'REJECTED') => {
    if (!selectedRefund) return;
    if (decision === 'REJECTED' && !reason.trim()) {
      setError('반려 사유를 입력해주세요.');
      return;
    }
    if (
      !window.confirm(
        '이 요청을 ' +
          (decision === 'APPROVED' ? '전액 환불 승인' : '반려') +
          '하시겠습니까? 실제 결제가 아닌 목업 처리입니다.',
      )
    )
      return;
    runMutation(
      (current) =>
        processRefund(
          current,
          selectedRefund.id,
          decision,
          reason,
          currentTimestamp(today),
          'ADMIN-MOCK',
        ),
      decision === 'APPROVED'
        ? '목업 환불 완료: REFUND 원장을 기록했습니다.'
        : '환불 요청을 반려했습니다.',
    );
  };

  return (
    <>
      <BillingFeedback notice={notice} error={error} />
      <BillingTable
        preferences={props.preferences}
        columns={columns}
        rows={rows}
        defaultStatus="REQUESTED"
        statusOptions={Object.entries(refundStatusLabels)}
        onRowClick={(id) => {
          setSelectedId(id);
          setDetailOpen(true);
          setReason('');
          clearFeedback();
        }}
      />
      <AdminDrawer
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        title="환불 요청 상세"
        resizable
      >
        {selectedRefund && refundBalance && (
          <div className="space-y-5">
            <StatusBadge variant={refundVariants[selectedRefund.status]}>
              {refundStatusLabels[selectedRefund.status]}
            </StatusBadge>
            <dl>
              <DetailItem label="요청 ID">{selectedRefund.id}</DetailItem>
              <DetailItem label="점주 ID">{selectedRefund.ownerId}</DetailItem>
              <DetailItem label="요청 포인트">
                {formatPoints(selectedRefund.points)}
              </DetailItem>
              <DetailItem label="현재 잔액">
                {formatPoints(refundBalance.balance)}
              </DetailItem>
              <DetailItem label="예약 중 포인트">
                {formatPoints(refundBalance.reserved)}
              </DetailItem>
              <DetailItem label="요청 시각">
                {timestamp(selectedRefund.requestedAt)}
              </DetailItem>
              <DetailItem label="처리 시각">
                {selectedRefund.processedAt
                  ? timestamp(selectedRefund.processedAt)
                  : '—'}
              </DetailItem>
              <DetailItem label="처리자">
                {selectedRefund.actorId ?? '—'}
              </DetailItem>
              <DetailItem label="반려 사유">
                {selectedRefund.rejectionReason || '—'}
              </DetailItem>
              <DetailItem label="취소 ID">
                {selectedRefund.cancellationId || '—'}
              </DetailItem>
            </dl>
            <p className="rounded-lg bg-surface-subtle p-4 text-caption-web text-text-secondary">
              잔액 전액 환불만 가능합니다. 예약 중 포인트는 제외됩니다.
              유효기간·환불 조건·수수료의 실제 적용은 백엔드 정책 연동이
              필요하며 현재는 수수료 없는 목업입니다.
            </p>
            {selectedRefund.status === 'REQUESTED' && (
              <>
                <p className="text-body-sm-web text-status-warning-fg">
                  {refundBlock ||
                    '현재 잔액 전액 환불이 가능한 목업 요청입니다.'}
                </p>
                <Input
                  label="반려 사유"
                  value={reason}
                  maxLength={300}
                  onChange={(event) => setReason(event.target.value)}
                  placeholder="반려 시 필수 입력"
                />
                <div className="flex justify-end gap-3">
                  <Button
                    variant="secondary"
                    disabled={!reason.trim()}
                    onClick={() => handleRefund('REJECTED')}
                  >
                    반려
                  </Button>
                  <Button
                    disabled={Boolean(refundBlock)}
                    onClick={() => handleRefund('APPROVED')}
                  >
                    전액 환불 승인
                  </Button>
                </div>
              </>
            )}
            <BillingFeedback notice={notice} error={error} />
          </div>
        )}
      </AdminDrawer>
    </>
  );
};
