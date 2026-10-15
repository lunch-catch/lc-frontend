import type {
  BillingState,
  LedgerEntry,
} from '@admin/features/billing/billingTypes';

export const createMockBillingState = (today: string): BillingState => {
  const owners = ['OWN-001', 'OWN-002', 'OWN-003', 'OWN-004', 'OWN-005'];
  const amounts = [50000, 30000, 100000, 10000, 30000];
  // 아직 API를 연결하지 않은 매출 화면의 집계 원장만 유지한다.
  const ledger: LedgerEntry[] = owners.map((ownerId, index) => ({
    id: 'L-PG-PAY-' + (index + 1),
    ownerId,
    type: 'CHARGE',
    amount: amounts[index],
    balanceDelta: amounts[index],
    reservedDelta: 0,
    createdAt: '2026-09-20T09:00:00+09:00',
    transactionId: 'PG-PAY-' + (index + 1),
  }));
  [0, 1, 4].forEach((index) => {
    const ownerId = owners[index];
    ledger.push(
      {
        id: 'L-RES-' + index,
        ownerId,
        type: 'RESERVE',
        amount: 10000,
        balanceDelta: -10000,
        reservedDelta: 10000,
        createdAt: '2026-09-21T00:00:00+09:00',
        campaignId: 'CMP-' + (index + 1),
      },
      {
        id: 'L-DEDUCT-' + index,
        ownerId,
        type: 'DEDUCT',
        amount: 6000,
        balanceDelta: 0,
        reservedDelta: -6000,
        createdAt: '2026-09-21T12:00:00+09:00',
        campaignId: 'CMP-' + (index + 1),
        serveId: 'SERVE-' + index,
      },
      {
        id: 'L-REL-' + index,
        ownerId,
        type: 'RELEASE',
        amount: 4000,
        balanceDelta: 4000,
        reservedDelta: -4000,
        createdAt: '2026-09-21T13:30:00+09:00',
        campaignId: 'CMP-' + (index + 1),
      },
    );
  });
  ledger.push(
    {
      id: 'L-ADJUST-2',
      ownerId: 'OWN-002',
      type: 'ADJUST',
      amount: 500,
      balanceDelta: 500,
      reservedDelta: 0,
      createdAt: '2026-09-22T09:00:00+09:00',
      campaignId: 'CMP-2',
      serveId: 'SERVE-1',
      reason: '과오 차감 정정',
    },
    {
      id: 'L-REFUND-4',
      ownerId: 'OWN-004',
      type: 'REFUND',
      amount: 10000,
      balanceDelta: -10000,
      reservedDelta: 0,
      createdAt: '2026-09-24T10:00:00+09:00',
      transactionId: 'MOCK-CANCEL-OLD',
    },
    {
      id: 'L-TODAY-RES',
      ownerId: 'OWN-003',
      type: 'RESERVE',
      amount: 30000,
      balanceDelta: -30000,
      reservedDelta: 30000,
      createdAt: today + 'T00:00:00+09:00',
      campaignId: 'CMP-3',
    },
    {
      id: 'L-TODAY-DEDUCT',
      ownerId: 'OWN-003',
      type: 'DEDUCT',
      amount: 10000,
      balanceDelta: 0,
      reservedDelta: -10000,
      createdAt: today + 'T11:00:00+09:00',
      campaignId: 'CMP-3',
      serveId: 'SERVE-TODAY',
    },
  );
  return { ledger };
};
