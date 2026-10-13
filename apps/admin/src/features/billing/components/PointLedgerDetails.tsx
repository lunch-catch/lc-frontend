import { useState } from 'react';
import { StatusBadge } from '@repo/ui';
import { formatDateTime, formatPoints } from '@repo/utils';
import { ArrowRight, Check, Copy } from 'lucide-react';

import type { PointLedgerItem } from '@admin/api/pointLedger';
import { ledgerTypeLabels } from '@admin/features/billing/billingUtils';
import { DetailItem } from '@admin/features/billing/components/BillingDetails';

const sourceLabels = {
  REALTIME: '실시간 처리',
  RECONCILIATION: '대사 처리',
  MANUAL: '수동 처리',
};

export const PointLedgerDetails = ({ item }: { item: PointLedgerItem }) => {
  const [copiedLabel, setCopiedLabel] = useState('');
  const [copyError, setCopyError] = useState('');
  // 선택 ID도 같은 위치에 표시해 거래 유형이 달라져도 비교하기 쉽게 한다.
  const identifiers = [
    { label: '원장 ID', value: item.ledgerId },
    { label: '점주 ID', value: item.ownerId },
    { label: '캠페인 ID', value: item.campaignId },
    { label: '서빙 ID', value: item.serveId },
    { label: '결제 거래 ID', value: item.pgTid },
  ].map(({ label, value }) => ({ label, value: String(value ?? '').trim() }));
  const amountColor =
    item.amount < 0
      ? 'text-status-danger-fg'
      : item.amount > 0
        ? 'text-status-success-fg'
        : 'text-text-primary';
  const copyIdentifier = async (label: string, value: string) => {
    setCopiedLabel('');
    setCopyError('');
    try {
      await navigator.clipboard.writeText(value);
      setCopiedLabel(label);
    } catch {
      // 브라우저가 클립보드를 허용하지 않아도 값은 직접 선택해 복사할 수 있다.
      setCopyError('복사하지 못했습니다. ID를 선택해 직접 복사해 주세요.');
    }
  };

  return (
    <div className="space-y-4">
      <section
        aria-label="포인트 변동 요약"
        className="rounded-lg border border-border-subtle bg-bg-surface p-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <StatusBadge variant="neutral">
            {ledgerTypeLabels[item.entryType]}
          </StatusBadge>
          <time
            dateTime={item.createdAt}
            className="text-caption-web text-text-secondary"
          >
            {formatDateTime(item.createdAt)}
          </time>
        </div>
        <p
          className={`mt-2 break-words text-3xl font-semibold tabular-nums ${amountColor}`}
        >
          {item.amount > 0 ? '+' : ''}
          {formatPoints(item.amount)}
        </p>
        <div className="mt-3 border-t border-border-subtle pt-3">
          <h3 className="mb-1 text-caption-web text-text-secondary">
            사용 가능 잔액
          </h3>
          <div className="flex flex-wrap items-center gap-2 text-body-sm-web tabular-nums">
            <span className="min-w-0 break-words font-medium">
              <span className="sr-only">변동 전 </span>
              {formatPoints(item.balanceBefore)}
            </span>
            <ArrowRight
              aria-hidden="true"
              className="size-4 shrink-0 text-text-tertiary"
            />
            <span className="min-w-0 break-words font-semibold">
              <span className="sr-only">변동 후 </span>
              {formatPoints(item.balanceAfter)}
            </span>
          </div>
          {/* 소진액은 예약 포인트에서 차감하므로 사용 가능 잔액이 그대로인 이유를 설명한다. */}
          {item.entryType === 'DEDUCT' && (
            <p className="mt-2 text-caption-web leading-5 text-text-secondary">
              예약 포인트에서 차감되어 사용 가능 잔액은 유지됩니다.
            </p>
          )}
        </div>
      </section>

      <section aria-label="처리 정보">
        <h3 className="mb-1 text-body-sm-web font-semibold">처리 정보</h3>
        <dl>
          {item.reason?.trim() && (
            <DetailItem label="사유" compact>
              <span className="whitespace-pre-wrap">{item.reason}</span>
            </DetailItem>
          )}
          <DetailItem label="기록 출처" compact>
            {sourceLabels[item.source]}
          </DetailItem>
        </dl>
      </section>

      <section
        aria-label="관련 식별자"
        className="border-t border-border-subtle pt-3"
      >
        <h3 className="mb-1 text-body-sm-web font-semibold">관련 식별자</h3>
        <dl>
          {identifiers.map(({ label, value }) => (
            <DetailItem key={label} label={label} compact>
              <div className="flex items-start gap-2">
                <span className="min-w-0 flex-1 select-text break-all font-mono">
                  {value || '-'}
                </span>
                {value && (
                  <button
                    type="button"
                    aria-label={`${label} 복사`}
                    title={copiedLabel === label ? '복사됨' : `${label} 복사`}
                    className="flex size-7 shrink-0 items-center justify-center rounded-md text-text-secondary hover:bg-surface-subtle hover:text-text-primary focus-visible:outline-2 focus-visible:outline-action-primary"
                    onClick={() => void copyIdentifier(label, value)}
                  >
                    {copiedLabel === label ? (
                      <Check
                        aria-hidden="true"
                        className="size-4 text-status-success-fg"
                      />
                    ) : (
                      <Copy aria-hidden="true" className="size-4" />
                    )}
                  </button>
                )}
              </div>
            </DetailItem>
          ))}
        </dl>
        <p
          role="status"
          className={
            copiedLabel
              ? 'mt-2 text-caption-web text-text-secondary'
              : 'sr-only'
          }
        >
          {copiedLabel ? `${copiedLabel}를 복사했습니다.` : ''}
        </p>
        {copyError && (
          <p
            role="alert"
            className="mt-2 text-caption-web text-status-danger-fg"
          >
            {copyError}
          </p>
        )}
      </section>
    </div>
  );
};
