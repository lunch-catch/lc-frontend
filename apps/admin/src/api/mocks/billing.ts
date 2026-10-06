import type {
  BillingCampaign,
  BillingState,
  LedgerEntry,
  Payment,
  PointPolicy,
} from '@admin/features/billing/billingTypes';
import { getBalance } from '@admin/features/billing/billingUtils';

export const createMockBillingState = (today: string): BillingState => {
  const owners = ['OWN-001', 'OWN-002', 'OWN-003', 'OWN-004', 'OWN-005'];
  const amounts = [50000, 30000, 100000, 10000, 30000];
  const payments: Payment[] = owners.map((ownerId, index) => ({
    id: 'PG-PAY-' + (index + 1),
    ownerId,
    amount: amounts[index],
    points: amounts[index],
    status: 'SUCCESS',
    paidAt: '2026-09-20T09:00:00+09:00',
  }));
  payments.push(
    {
      id: 'PG-PAY-7',
      ownerId: 'OWN-001',
      amount: 10000,
      points: 10000,
      status: 'FAILED',
      paidAt: '2026-09-25T10:00:00+09:00',
      failureReason: '한도 초과',
    },
    {
      id: 'PG-PAY-8',
      ownerId: 'OWN-002',
      amount: 30000,
      points: 30000,
      status: 'PENDING',
      paidAt: today + 'T10:00:00+09:00',
    },
    {
      id: 'PG-PAY-9',
      ownerId: 'OWN-004',
      amount: 10000,
      points: 10000,
      status: 'CANCELED',
      paidAt: '2026-09-26T10:00:00+09:00',
      cancellationId: 'PG-CANCEL-9',
    },
  );
  const ledger: LedgerEntry[] = payments
    .filter((payment) => payment.status === 'SUCCESS')
    .map((payment) => ({
      id: 'L-' + payment.id,
      ownerId: payment.ownerId,
      type: 'CHARGE',
      amount: payment.points,
      balanceDelta: payment.points,
      reservedDelta: 0,
      createdAt: payment.paidAt,
      transactionId: payment.id,
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
  const campaigns: BillingCampaign[] = owners.map((ownerId, index) => ({
    id: 'CMP-' + (index + 1),
    ownerId,
    storeName: [
      '한상차림',
      '오늘의 파스타',
      '도시락 연구소',
      '미소 카레',
      '정성 한끼',
    ][index],
    status: index === 0 ? 'ACTIVE' : index === 4 ? 'SCHEDULED' : 'PAUSED',
    registeredAt: '2026-09-' + (20 + index) + 'T10:00:00+09:00',
    startDate: '2026-09-20',
    endDate: '2026-10-20',
    dailyBudget: 10000,
    validImpressions:
      index === 0 || index === 1 || index === 4 ? 600 : index === 2 ? 1000 : 0,
  }));
  const policy: PointPolicy = {
    minimum: 10000,
    products: [10000, 30000, 50000, 100000],
    actorId: 'SYSTEM-MOCK',
    updatedAt: '2026-09-20T00:00:00+09:00',
    reason: '기본 정책',
  };
  return {
    payments,
    ledger,
    campaigns,
    policy,
    policyHistory: [policy],
    refunds: [
      {
        id: 'REF-001',
        ownerId: 'OWN-002',
        points: getBalance(ledger, 'OWN-002').balance,
        status: 'REQUESTED',
        requestedAt: today + 'T10:00:00+09:00',
      },
      {
        id: 'REF-002',
        ownerId: 'OWN-001',
        points: getBalance(ledger, 'OWN-001').balance,
        status: 'REQUESTED',
        requestedAt: today + 'T10:05:00+09:00',
      },
      {
        id: 'REF-003',
        ownerId: 'OWN-003',
        points: 90000,
        status: 'REQUESTED',
        requestedAt: today + 'T11:10:00+09:00',
      },
      {
        id: 'REF-004',
        ownerId: 'OWN-004',
        points: 10000,
        status: 'APPROVED',
        requestedAt: '2026-09-24T09:30:00+09:00',
        processedAt: '2026-09-24T10:00:00+09:00',
        actorId: 'ADMIN-MOCK',
        cancellationId: 'MOCK-CANCEL-OLD',
      },
    ],
  };
};
