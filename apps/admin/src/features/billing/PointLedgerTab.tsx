import { useMemo, useState } from 'react';
import { StatusBadge } from '@repo/ui';
import { formatDateTime, formatPoints } from '@repo/utils';

import { AdminDrawer } from '@admin/components/AdminDrawer/AdminDrawer';

import { DetailItem } from './BillingDetails';
import { BillingTable } from './BillingTable';
import type { LedgerType } from './billingTypes';
import { getLedgerRows, ledgerTypeLabels } from './billingUtils';
import { type BillingTabProps, cell, getMonthRange } from './billingView';

const columns = [
  { label: '점주 ID', width: 14 },
  { label: '변동 유형', width: 14 },
  { label: '사용 가능 잔액 (전)', width: 17 },
  { label: '거래 금액', width: 16 },
  { label: '사용 가능 잔액 (후)', width: 17 },
  { label: '일시', width: 22 },
];

const ledgerTypeDescriptions: Record<LedgerType, string> = {
  CHARGE: '결제가 성공해 사용 가능한 잔액에 포인트가 추가된 내역입니다.',
  RESERVE:
    '광고에 사용할 포인트를 사용 가능한 잔액에서 미리 확보한 내역입니다.',
  DEDUCT: '예약 중인 포인트에서 광고 노출 비용을 사용한 내역입니다.',
  RELEASE:
    '사용하지 않은 예약 포인트를 사용 가능한 잔액으로 돌려놓은 내역입니다.',
  ADJUST: '원장 기록을 정정한 내역입니다. 조정 사유를 함께 확인해주세요.',
  REFUND: '점주에게 환불해 사용 가능한 잔액에서 포인트가 빠진 내역입니다.',
};

export const PointLedgerTab = ({
  state,
  preferences,
  today,
}: BillingTabProps) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const ledgerRows = useMemo(() => getLedgerRows(state.ledger), [state.ledger]);
  const selectedLedger = ledgerRows.find((item) => item.id === selectedId);
  const balanceRows = selectedLedger
    ? [
        {
          label: '사용 가능 잔액',
          before: selectedLedger.beforeBalance,
          change: selectedLedger.balanceDelta,
          after: selectedLedger.afterBalance,
        },
        {
          label: '예약 중 포인트',
          before: selectedLedger.beforeReserved,
          change: selectedLedger.reservedDelta,
          after: selectedLedger.afterReserved,
        },
        {
          label: '미소진 잔액 합계',
          before: selectedLedger.beforeBalance + selectedLedger.beforeReserved,
          change: selectedLedger.balanceDelta + selectedLedger.reservedDelta,
          after: selectedLedger.afterBalance + selectedLedger.afterReserved,
        },
      ]
    : [];
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
      // 예약 잔액에서 소진된 거래도 금액을 표시하며, 잔액 증감은 상세에서 따로 비교한다.
      cell(formatPoints(item.amount), item.amount),
      cell(formatPoints(item.afterBalance), item.afterBalance),
      cell(formatDateTime(item.createdAt), item.createdAt),
    ],
  }));

  return (
    <>
      <p className="text-caption-web leading-5 text-text-secondary">
        사용 가능 잔액에는 예약 중 포인트가 포함되지 않습니다. 소진은 예약
        포인트에서 차감되므로 사용 가능 잔액의 전후 금액이 같을 수 있습니다.
        행을 선택하면 예약 포인트의 변화도 확인할 수 있습니다.
      </p>
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
            <p className="text-body-sm-web leading-6 text-text-secondary">
              {ledgerTypeDescriptions[selectedLedger.type]}
            </p>
            <dl>
              <DetailItem label="점주 ID">{selectedLedger.ownerId}</DetailItem>
              <DetailItem label="거래 금액">
                {formatPoints(selectedLedger.amount)}
              </DetailItem>
              <DetailItem label="일시">
                {formatDateTime(selectedLedger.createdAt)}
              </DetailItem>
              {selectedLedger.type === 'ADJUST' && (
                <DetailItem label="조정 사유">
                  {selectedLedger.reason || '—'}
                </DetailItem>
              )}
            </dl>
            <section className="space-y-3" aria-label="거래 전후 잔액 비교">
              <h3 className="text-body-sm-web font-semibold">잔액 변화</h3>
              <div className="overflow-x-auto rounded-lg border border-border-subtle">
                <table className="w-full whitespace-nowrap text-caption-web tabular-nums">
                  <caption className="sr-only">거래 전후 잔액과 증감</caption>
                  <thead className="bg-surface-subtle text-text-secondary">
                    <tr>
                      <th
                        scope="col"
                        className="px-3 py-3 text-left font-medium"
                      >
                        구분
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3 text-right font-medium"
                      >
                        변동 전
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3 text-right font-medium"
                      >
                        증감
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3 text-right font-medium"
                      >
                        변동 후
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {balanceRows.map((item) => (
                      <tr
                        key={item.label}
                        className="border-t border-border-subtle bg-bg-surface"
                      >
                        <th
                          scope="row"
                          className="px-3 py-3 text-left font-medium"
                        >
                          {item.label}
                        </th>
                        <td className="px-3 py-3 text-right">
                          {formatPoints(item.before)}
                        </td>
                        <td className="px-3 py-3 text-right">
                          {formatPoints(item.change, { signed: true })}
                        </td>
                        <td className="px-3 py-3 text-right">
                          {formatPoints(item.after)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-caption-web leading-5 text-text-secondary">
                미소진 잔액 합계 = 사용 가능 잔액 + 예약 중 포인트. 예약과 예약
                해제는 두 잔액 사이의 이동이므로 합계는 바뀌지 않습니다.
              </p>
            </section>
            <dl>
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
          </div>
        )}
      </AdminDrawer>
    </>
  );
};
