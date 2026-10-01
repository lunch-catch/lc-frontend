import { useMemo, useState } from 'react';
import { StatusBadge } from '@repo/ui';
import { formatDateTime } from '@repo/utils';

import { AdminDrawer } from '@admin/components/AdminDrawer/AdminDrawer';

import {
  aggregateLedger,
  formatPoints,
  getLedgerRows,
  ledgerTypeLabels,
} from './billingData';
import { DetailItem } from './BillingDetails';
import { BillingMetrics } from './BillingMetrics';
import { BillingTable } from './BillingTable';
import { type BillingTabProps, cell, getMonthRange } from './billingView';
const columns = [
  { label: '점주 ID', width: 14 },
  { label: '변동 유형', width: 14 },
  { label: '변동 전 잔액', width: 17 },
  { label: '변동 금액', width: 16 },
  { label: '변동 후 잔액', width: 17 },
  { label: '일시', width: 22 },
];
export const PointLedgerTab = ({
  state,
  preferences,
  today,
}: BillingTabProps) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const ledgerRows = useMemo(() => getLedgerRows(state.ledger), [state.ledger]);
  const selectedLedger = ledgerRows.find((item) => item.id === selectedId);
  const rows = ledgerRows.map((item) => ({
    id: item.id,
    date: item.createdAt,
    status: item.type,
    ownerId: item.ownerId,
    search: [
      item.ownerId,
      item.campaignId,
      item.serveId,
      item.transactionId,
    ].join(' '),
    cells: [
      cell(item.ownerId, item.ownerId),
      cell(ledgerTypeLabels[item.type], item.type),
      cell(formatPoints(item.beforeBalance), item.beforeBalance),
      cell(
        (item.balanceDelta > 0 ? '+' : '') + formatPoints(item.balanceDelta),
        item.balanceDelta,
      ),
      cell(formatPoints(item.afterBalance), item.afterBalance),
      cell(formatDateTime(item.createdAt), item.createdAt),
    ],
  }));
  return (
    <>
      <BillingTable
        preferences={preferences}
        columns={columns}
        rows={rows}
        defaultRange={getMonthRange(today)}
        statusLabel="변동 유형"
        statusOptions={Object.entries(ledgerTypeLabels)}
        onRowClick={(id) => {
          setSelectedId(id);
          setDetailOpen(true);
        }}
        renderSummary={(range) => {
          const summary = aggregateLedger(
            state.ledger,
            range.startDate,
            range.endDate,
          );
          return (
            <BillingMetrics
              balance={[
                '미소진 잔액 합계',
                summary.unspent,
                '기간 마지막에 남은 포인트 · 잔액 + 아직 사용하지 않은 예약 포인트',
              ]}
              items={[
                ['충전액', summary.charge, '점주가 결제해서 충전한 포인트'],
                [
                  '예약액',
                  summary.reserve,
                  '광고에 쓰려고 잔액에서 미리 확보한 포인트',
                ],
                ['소진액', summary.spend, '실제 광고 노출에 사용한 포인트'],
                [
                  '예약 해제액',
                  summary.release,
                  '예약했지만 쓰지 않아 잔액으로 돌려놓은 포인트',
                ],
                [
                  '무효 환급액',
                  summary.invalidCredit,
                  '무효로 판정된 광고 노출 비용을 돌려준 포인트',
                ],
                ['환불액', summary.refund, '점주에게 환불한 포인트'],
              ]}
            />
          );
        }}
      />
      <AdminDrawer
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        title="포인트 변동 상세"
        resizable
      >
        {selectedLedger && (
          <div className="space-y-5">
            <StatusBadge variant="info">
              {ledgerTypeLabels[selectedLedger.type]}
            </StatusBadge>
            <dl>
              <DetailItem label="점주 ID">{selectedLedger.ownerId}</DetailItem>
              <DetailItem label="변동 전 잔액">
                {formatPoints(selectedLedger.beforeBalance)}
              </DetailItem>
              <DetailItem label="변동 금액">
                {(selectedLedger.balanceDelta > 0 ? '+' : '') +
                  formatPoints(selectedLedger.balanceDelta)}
              </DetailItem>
              <DetailItem label="변동 후 잔액">
                {formatPoints(selectedLedger.afterBalance)}
              </DetailItem>
              <DetailItem label="일시">
                {formatDateTime(selectedLedger.createdAt)}
              </DetailItem>
              <DetailItem label="캠페인 ID">
                {selectedLedger.campaignId || '—'}
              </DetailItem>
              <DetailItem label="serve_id">
                {selectedLedger.serveId || '—'}
              </DetailItem>
              <DetailItem label="결제대행사 거래 ID">
                {selectedLedger.transactionId || '—'}
              </DetailItem>
            </dl>
            <p className="rounded-lg bg-surface-subtle p-4 text-caption-web text-text-secondary">
              +는 잔액 증가, −는 잔액 감소입니다. 잔액에는 예약 중 포인트가
              포함되지 않습니다. 광고 소진은 예약 포인트에서 차감되어 이 잔액의
              변동 금액은 0P일 수 있습니다.
            </p>
          </div>
        )}
      </AdminDrawer>
    </>
  );
};
