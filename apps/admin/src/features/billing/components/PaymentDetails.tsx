import { useEffect, useRef, useState } from 'react';
import { Button, StatusBadge } from '@repo/ui';
import { formatDateTime, formatPoints, formatWon } from '@repo/utils';

import { ApiError } from '@admin/api/client';
import { type AdminPayment, recheckPayment } from '@admin/api/payments';

import {
  getPaymentError,
  paymentStatusLabels,
  paymentVariants,
  reconciliationLabels,
} from '../paymentUtils';
import { DetailItem } from './BillingDetails';

interface PaymentDetailsProps {
  payment: AdminPayment;
  onRechecked: (payment: AdminPayment) => void;
  onRefresh: () => void;
}

const displayDate = (value: string | null) =>
  value ? formatDateTime(value) : '—';

export const PaymentDetails = ({
  payment,
  onRechecked,
  onRefresh,
}: PaymentDetailsProps) => {
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [unavailable, setUnavailable] = useState(false);
  // busy가 화면에 반영되기 전의 연속 클릭도 동기적으로 차단한다.
  const locked = useRef(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const handleRecheck = async () => {
    if (locked.current || payment.status !== 'UNKNOWN' || unavailable) return;
    locked.current = true;
    setBusy(true);
    setNotice('');
    setError('');
    try {
      const updated = await recheckPayment(payment.paymentId);
      if (!mounted.current) {
        // 상세 패널을 닫았어도 서버에서 끝난 처리 결과는 목록에 반영한다.
        onRefresh();
        return;
      }
      onRechecked(updated);
      // HTTP 200이어도 UNKNOWN이면 결제 확정 성공으로 안내하지 않는다.
      setNotice(
        updated.status === 'UNKNOWN'
          ? '재조회했지만 아직 결제 결과를 확정하지 못했습니다.'
          : `재조회 결과가 '${paymentStatusLabels[updated.status]}' 상태로 반영되었습니다.`,
      );
    } catch (cause) {
      if (!mounted.current) return;
      setError(getPaymentError(cause));
      if (
        cause instanceof ApiError &&
        ['BILLING-004', 'BILLING-005'].includes(cause.code ?? '')
      ) {
        // 다른 처리 경로에서 이미 확정되거나 삭제된 결제는 반복 재조회하지 않는다.
        setUnavailable(true);
        onRefresh();
      }
    } finally {
      locked.current = false;
      if (mounted.current) setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <StatusBadge variant={paymentVariants[payment.status]}>
          {paymentStatusLabels[payment.status]}
        </StatusBadge>
        {payment.status === 'UNKNOWN' && (
          <Button
            variant="secondary"
            disabled={busy || unavailable}
            onClick={() => void handleRecheck()}
          >
            {busy ? '재조회 중…' : '결제 재조회'}
          </Button>
        )}
      </div>
      {notice && (
        <p role="status" className="text-body-sm-web text-text-secondary">
          {notice}
        </p>
      )}
      {error && (
        <p role="alert" className="text-body-sm-web text-status-danger-fg">
          {error}
        </p>
      )}
      <dl>
        <DetailItem label="결제 ID" compact>
          {payment.paymentId}
        </DetailItem>
        <DetailItem label="점주 ID" compact>
          {payment.ownerId}
        </DetailItem>
        <DetailItem label="주문 번호" compact>
          {payment.orderId}
        </DetailItem>
        <DetailItem label="거래 ID" compact>
          {payment.pgTid ?? '—'}
        </DetailItem>
        <DetailItem label="결제 금액" compact>
          {formatWon(payment.amount)}
        </DetailItem>
        <DetailItem label="충전 포인트" compact>
          {formatPoints(payment.chargedPoint)}
        </DetailItem>
        <DetailItem label="요청 시각" compact>
          {displayDate(payment.requestedAt)}
        </DetailItem>
        <DetailItem label="승인 시각" compact>
          {displayDate(payment.approvedAt)}
        </DetailItem>
        <DetailItem label="취소 시각" compact>
          {displayDate(payment.canceledAt)}
        </DetailItem>
        <DetailItem label="실패 사유" compact>
          {payment.failureReason ?? '—'}
        </DetailItem>
      </dl>
      {payment.status === 'UNKNOWN' && (
        <p className="rounded-md bg-status-warning-bg p-3 text-body-sm-web text-status-warning-fg">
          승인 여부가 아직 확인되지 않은 결제입니다. 재조회하면 결제대행사의
          결과에 따라 결제 상태와 충전 내역이 갱신됩니다.
        </p>
      )}
      <section className="space-y-2 border-t border-border-subtle pt-4">
        <h3 className="text-body-sm-web font-semibold text-text-primary">
          자동 재조회
        </h3>
        {payment.reconciliation ? (
          <dl>
            <DetailItem label="진행 상태" compact>
              {reconciliationLabels[payment.reconciliation.status]}
            </DetailItem>
            <DetailItem label="시도 횟수" compact>
              {payment.reconciliation.attemptCount} /{' '}
              {payment.reconciliation.maxRetry}
            </DetailItem>
            <DetailItem label="다음 재조회" compact>
              {displayDate(payment.reconciliation.nextRetryAt)}
            </DetailItem>
            <DetailItem label="마지막 오류" compact>
              {payment.reconciliation.lastError ?? '—'}
            </DetailItem>
          </dl>
        ) : (
          <p className="text-caption-web text-text-secondary">
            자동 재조회 기록이 없습니다.
          </p>
        )}
      </section>
    </div>
  );
};
