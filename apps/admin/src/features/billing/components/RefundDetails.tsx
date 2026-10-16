import { useState } from 'react';
import { Button, Input, StatusBadge } from '@repo/ui';
import { formatDateTime, formatPoints } from '@repo/utils';

import { ApiError } from '@admin/api/client';
import { type AdminRefund, processRefund } from '@admin/api/refunds';
import { AdminModal } from '@admin/components/AdminModal/AdminModal';
import {
  refundStatusLabels,
  refundVariants,
} from '@admin/features/billing/billingManagementUtils';
import { useBillingMutation } from '@admin/features/billing/useBillingMutation';

import { DetailItem } from './BillingDetails';

interface RefundDetailsProps {
  refund: AdminRefund;
  onCompleted: (message: string) => void;
  onRefresh: () => void;
}
export const RefundDetails = ({
  refund,
  onCompleted,
  onRefresh,
}: RefundDetailsProps) => {
  const mutation = useBillingMutation();
  const [decision, setDecision] = useState<'approve' | 'reject' | null>(null);
  const [reason, setReason] = useState('');
  const [unavailable, setUnavailable] = useState(false);
  const blocked = refund.hasActiveCampaign
    ? '집행 중인 캠페인이 있어 승인할 수 없습니다.'
    : refund.currentBalance < refund.amount
      ? '현재 잔액이 요청 금액보다 적어 승인할 수 없습니다.'
      : '';
  const submit = () => {
    if (!decision || unavailable || (decision === 'approve' && blocked)) return;
    if (decision === 'reject' && (!reason.trim() || reason.length > 255)) {
      mutation.setError('반려 사유를 1~255자로 입력해 주세요.');
      return;
    }
    void mutation.run(
      () => processRefund(refund.refundRequestId, decision, reason.trim()),
      () =>
        onCompleted(
          decision === 'approve'
            ? '환불 요청을 승인했습니다.'
            : '환불 요청을 반려했습니다.',
        ),
      (cause) => {
        // 다른 관리자가 이미 처리했거나 삭제된 요청은 같은 화면에서 재처리하지 않는다.
        if (
          cause instanceof ApiError &&
          ['BILLING-014', 'BILLING-015'].includes(cause.code ?? '')
        )
          setUnavailable(true);
        onRefresh();
      },
    );
  };
  return (
    <div className="space-y-5">
      <StatusBadge variant={refundVariants[refund.status]}>
        {refundStatusLabels[refund.status]}
      </StatusBadge>
      <dl>
        <DetailItem label="요청 ID" compact>
          {refund.refundRequestId}
        </DetailItem>
        <DetailItem label="점주 ID" compact>
          {refund.ownerId}
        </DetailItem>
        <DetailItem label="요청 포인트" compact>
          {formatPoints(refund.amount)}
        </DetailItem>
        <DetailItem label="수수료" compact>
          {refund.fee === null ? '—' : formatPoints(refund.fee)}
        </DetailItem>
        <DetailItem label="현재 잔액" compact>
          {formatPoints(refund.currentBalance)}
        </DetailItem>
        <DetailItem label="집행 캠페인" compact>
          {refund.hasActiveCampaign ? '있음' : '없음'}
        </DetailItem>
        <DetailItem label="요청 사유" compact>
          {refund.reason || '—'}
        </DetailItem>
        <DetailItem label="요청 시각" compact>
          {formatDateTime(refund.requestedAt)}
        </DetailItem>
        <DetailItem label="처리 시각" compact>
          {refund.processedAt ? formatDateTime(refund.processedAt) : '—'}
        </DetailItem>
        <DetailItem label="처리자 ID" compact>
          {refund.processedBy ?? '—'}
        </DetailItem>
        <DetailItem label="반려 사유" compact>
          {refund.rejectReason || '—'}
        </DetailItem>
      </dl>
      {refund.status === 'REQUESTED' && (
        <>
          {blocked && (
            <p className="text-body-sm-web text-status-warning-fg">{blocked}</p>
          )}
          <div className="flex justify-end gap-2">
            <Button
              variant="neutral"
              disabled={unavailable || mutation.busy}
              onClick={() => {
                mutation.setError('');
                setDecision('reject');
              }}
            >
              반려
            </Button>
            <Button
              disabled={Boolean(blocked) || unavailable || mutation.busy}
              onClick={() => {
                mutation.setError('');
                setDecision('approve');
              }}
            >
              환불 승인
            </Button>
          </div>
        </>
      )}
      <AdminModal
        open={decision !== null}
        onClose={() => {
          if (!mutation.busy) setDecision(null);
        }}
        title={decision === 'approve' ? '환불 승인' : '환불 반려'}
      >
        <div className="space-y-4">
          <p className="text-body-sm-web text-text-secondary">
            점주 {refund.ownerId}의 {formatPoints(refund.amount)} 환불 요청을{' '}
            {decision === 'approve' ? '승인' : '반려'}하시겠습니까?
          </p>
          {decision === 'approve' ? (
            <p className="rounded-md bg-status-warning-bg p-3 text-caption-web text-status-warning-fg">
              현재 승인은 환불 원장과 요청 상태만 처리하며 실제 송금은 진행하지
              않습니다.
            </p>
          ) : (
            <Input
              label="반려 사유"
              required
              value={reason}
              maxLength={255}
              disabled={mutation.busy}
              onChange={(event) => {
                setReason(event.target.value);
                mutation.setError('');
              }}
              placeholder="점주에게 안내할 사유를 입력하세요"
            />
          )}
          {mutation.error && (
            <p role="alert" className="text-caption-web text-status-danger-fg">
              {mutation.error}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button
              variant="neutral"
              disabled={mutation.busy}
              onClick={() => setDecision(null)}
            >
              취소
            </Button>
            <Button
              isLoading={mutation.busy}
              disabled={unavailable}
              onClick={submit}
            >
              {decision === 'approve' ? '승인' : '반려'}
            </Button>
          </div>
        </div>
      </AdminModal>
    </div>
  );
};
