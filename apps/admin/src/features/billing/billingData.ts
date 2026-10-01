// API 연동 전 화면 흐름을 검증하는 목업이다. 실제 잔액·집계·환불 처리는 서버가 확정한다.
export type PaymentStatus =
  'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELED' | 'UNKNOWN';
export type LedgerType =
  'CHARGE' | 'RESERVE' | 'SPEND' | 'RELEASE' | 'INVALID_CREDIT' | 'REFUND';
export type RefundStatus = 'REQUESTED' | 'APPROVED' | 'REJECTED';
export type ReportPeriod = 'day' | 'week' | 'month';

export interface Payment {
  id: string;
  ownerId: string;
  amount: number;
  points: number;
  status: PaymentStatus;
  paidAt: string;
  failureReason?: string;
  cancellationId?: string;
}
export interface LedgerEntry {
  id: string;
  ownerId: string;
  type: LedgerType;
  // 거래 규모와 잔액 변동은 다르다. 예약 포인트를 소진하면 amount만큼 써도 balanceDelta는 0이다.
  amount: number;
  balanceDelta: number;
  reservedDelta: number;
  createdAt: string;
  campaignId?: string;
  serveId?: string;
  transactionId?: string;
}
export interface RefundRequest {
  id: string;
  ownerId: string;
  points: number;
  status: RefundStatus;
  requestedAt: string;
  processedAt?: string;
  actorId?: string;
  rejectionReason?: string;
  cancellationId?: string;
}
export interface BillingCampaign {
  id: string;
  ownerId: string;
  storeName: string;
  status: 'ACTIVE' | 'PAUSED' | 'SCHEDULED' | 'ENDED';
  registeredAt: string;
  startDate: string;
  endDate: string;
  dailyBudget: number;
  validImpressions: number;
}
export interface PointPolicy {
  minimum: number;
  products: number[];
  actorId: string;
  updatedAt: string;
  reason: string;
}
export interface BillingState {
  payments: Payment[];
  ledger: LedgerEntry[];
  refunds: RefundRequest[];
  campaigns: BillingCampaign[];
  policy: PointPolicy;
  policyHistory: PointPolicy[];
}
export interface LedgerRow extends LedgerEntry {
  beforeBalance: number;
  afterBalance: number;
  afterReserved: number;
}
export interface Totals {
  charge: number;
  reserve: number;
  spend: number;
  release: number;
  invalidCredit: number;
  refund: number;
  balance: number;
  reserved: number;
  unspent: number;
}
export interface ReportRow extends Totals {
  key: string;
  pending: boolean;
  mismatchCount: number;
}
export interface DailyCache {
  date: string;
  charge: number;
  spend: number;
  invalidCredit: number;
  refund: number;
  unspent: number;
}

export const paymentStatusLabels: Record<PaymentStatus, string> = {
  PENDING: '결제 대기',
  SUCCESS: '결제 성공',
  FAILED: '결제 실패',
  CANCELED: '취소됨',
  UNKNOWN: '확인 필요',
};
export const ledgerTypeLabels: Record<LedgerType, string> = {
  CHARGE: '충전',
  RESERVE: '예약',
  SPEND: '소진',
  RELEASE: '예약 해제',
  INVALID_CREDIT: '무효 환급',
  REFUND: '환불',
};
export const refundStatusLabels: Record<RefundStatus, string> = {
  REQUESTED: '요청',
  APPROVED: '승인',
  REJECTED: '반려',
};
export const formatPoints = (value: number) =>
  value.toLocaleString('ko-KR') + ' P';
export const formatWon = (value: number) =>
  value.toLocaleString('ko-KR') + ' 원';

export const getKoreaDate = (date = new Date()) =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
export const inDateRange = (timestamp: string, start: string, end: string) =>
  (!start || timestamp.slice(0, 10) >= start) &&
  (!end || timestamp.slice(0, 10) <= end);

export const getLedgerRows = (ledger: LedgerEntry[]): LedgerRow[] => {
  // 조회 기간으로 필터링하기 전에 전체 거래를 누적해야 각 행의 변동 전후 잔액이 맞는다.
  const balances = new Map<string, { balance: number; reserved: number }>();
  return [...ledger]
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .map((entry) => {
      const previous = balances.get(entry.ownerId) ?? {
        balance: 0,
        reserved: 0,
      };
      const next = {
        balance: previous.balance + entry.balanceDelta,
        reserved: previous.reserved + entry.reservedDelta,
      };
      balances.set(entry.ownerId, next);
      return {
        ...entry,
        beforeBalance: previous.balance,
        afterBalance: next.balance,
        afterReserved: next.reserved,
      };
    });
};

export const getBalance = (
  ledger: LedgerEntry[],
  ownerId?: string,
  endDate?: string,
) =>
  ledger
    .filter(
      (entry) =>
        (!ownerId || entry.ownerId === ownerId) &&
        (!endDate || entry.createdAt.slice(0, 10) <= endDate),
    )
    .reduce(
      (total, entry) => ({
        balance: total.balance + entry.balanceDelta,
        reserved: total.reserved + entry.reservedDelta,
      }),
      { balance: 0, reserved: 0 },
    );

export const aggregateLedger = (
  ledger: LedgerEntry[],
  start: string,
  end: string,
  ownerId?: string,
): Totals => {
  const entries = ledger.filter(
    (entry) =>
      (!ownerId || entry.ownerId === ownerId) &&
      inDateRange(entry.createdAt, start, end),
  );
  const sum = (type: LedgerType) =>
    entries
      .filter((entry) => entry.type === type)
      .reduce((total, entry) => total + entry.amount, 0);
  // 기간 이전 거래도 포함해야 기간 말 잔액이 계산된다. 예약은 이동이지 소진이 아니다.
  const { balance, reserved } = getBalance(ledger, ownerId, end);
  return {
    charge: sum('CHARGE'),
    reserve: sum('RESERVE'),
    spend: sum('SPEND'),
    release: sum('RELEASE'),
    invalidCredit: sum('INVALID_CREDIT'),
    refund: sum('REFUND'),
    balance,
    reserved,
    unspent: balance + reserved,
  };
};

export const getRefundBlockReason = (
  state: BillingState,
  request: RefundRequest,
) => {
  if (request.status !== 'REQUESTED') return '이미 처리된 환불 요청입니다.';
  if (
    state.campaigns.some(
      (campaign) =>
        campaign.ownerId === request.ownerId && campaign.status === 'ACTIVE',
    )
  )
    return '활성 캠페인이 있습니다. 점주가 먼저 캠페인을 중단해야 합니다.';
  const { balance, reserved } = getBalance(state.ledger, request.ownerId);
  if (request.points > balance)
    return reserved > 0
      ? '예약 중 포인트는 환불할 수 없습니다. 13:30 예약 해제 후 잔액을 다시 확인해주세요.'
      : '환불 요청이 현재 잔액을 초과합니다.';
  if (request.points <= 0 || request.points !== balance)
    return '부분 환불은 불가하며 현재 잔액 전액만 환불할 수 있습니다.';
  return '';
};

export const processRefund = (
  state: BillingState,
  id: string,
  decision: 'APPROVED' | 'REJECTED',
  reason: string,
  now: string,
  actorId: string,
): BillingState => {
  const request = state.refunds.find((item) => item.id === id);
  if (!request || request.status !== 'REQUESTED')
    throw new Error('처리 가능한 환불 요청이 없습니다.');
  if (decision === 'REJECTED' && !reason.trim())
    throw new Error('반려 사유를 입력해주세요.');
  if (decision === 'APPROVED') {
    const blocked = getRefundBlockReason(state, request);
    if (blocked) throw new Error(blocked);
  }
  // 실제 취소/계좌 환급 성공 후 원장을 기록해야 한다. 여기서는 목업 성공만 재현한다.
  const cancellationId =
    decision === 'APPROVED' ? 'MOCK-CANCEL-' + id : undefined;
  return {
    ...state,
    refunds: state.refunds.map((item) =>
      item.id === id
        ? {
            ...item,
            status: decision,
            processedAt: now,
            actorId,
            rejectionReason:
              decision === 'REJECTED' ? reason.trim() : undefined,
            cancellationId,
          }
        : item,
    ),
    ledger:
      decision === 'APPROVED'
        ? [
            ...state.ledger,
            {
              id: 'LEDGER-' + id,
              ownerId: request.ownerId,
              type: 'REFUND',
              amount: request.points,
              balanceDelta: -request.points,
              reservedDelta: 0,
              createdAt: now,
              transactionId: cancellationId,
            },
          ]
        : state.ledger,
  };
};

export const validatePolicy = (minimum: number, products: number[]) => {
  if (!Number.isSafeInteger(minimum) || minimum <= 0)
    return '최소 충전 금액은 0보다 큰 정수여야 합니다.';
  if (
    !products.length ||
    products.some((value) => !Number.isSafeInteger(value) || value < minimum)
  )
    return '충전 상품 금액은 최소 충전 금액 이상의 정수여야 합니다.';
  if (new Set(products).size !== products.length)
    return '중복된 충전 상품 금액이 있습니다.';
  return '';
};

const periodKey = (date: string, period: ReportPeriod) => {
  if (period === 'month') return date.slice(0, 7);
  if (period === 'day') return date;
  const day = new Date(date + 'T00:00:00Z');
  day.setUTCDate(day.getUTCDate() - ((day.getUTCDay() + 6) % 7));
  return day.toISOString().slice(0, 10) + ' 주';
};

export const createDailyCache = (
  ledger: LedgerEntry[],
  today: string,
): DailyCache[] =>
  [...new Set(ledger.map((entry) => entry.createdAt.slice(0, 10)))]
    .filter((date) => date < today)
    .map((date) => {
      const totals = aggregateLedger(ledger, date, date);
      return {
        date,
        charge: totals.charge,
        spend: totals.spend,
        invalidCredit: totals.invalidCredit,
        refund: totals.refund,
        unspent: totals.unspent,
      };
    });

const reportMetricKeys: (keyof Omit<DailyCache, 'date'>)[] = [
  'charge',
  'spend',
  'invalidCredit',
  'refund',
  'unspent',
];

export const getSalesReport = (
  ledger: LedgerEntry[],
  cache: DailyCache[],
  period: ReportPeriod,
  start: string,
  end: string,
  today: string,
): ReportRow[] => {
  const dates = [
    ...new Set([
      ...ledger.map((entry) => entry.createdAt.slice(0, 10)),
      ...cache.map((item) => item.date),
      today,
    ]),
  ]
    .filter(
      (date) =>
        (!start || date >= start) && (!end || date <= end) && date <= today,
    )
    .sort();
  const groups = new Map<string, string[]>();
  dates.forEach((date) => {
    const key = periodKey(date, period);
    groups.set(key, [...(groups.get(key) ?? []), date]);
  });
  return [...groups.entries()].map(([key, days]) => {
    const completed = days.filter((date) => date < today);
    const selectedLedger = ledger.filter((entry) =>
      completed.includes(entry.createdAt.slice(0, 10)),
    );
    const flows = aggregateLedger(selectedLedger, '', '');
    const lastDay = completed.at(-1);
    const balances = lastDay
      ? getBalance(ledger, undefined, lastDay)
      : { balance: 0, reserved: 0 };
    const mismatchCount = completed.filter((date) => {
      const cached = cache.find((row) => row.date === date);
      const actual = aggregateLedger(ledger, date, date);
      return (
        !cached || reportMetricKeys.some((key) => actual[key] !== cached[key])
      );
    }).length;
    // 주/월 잔액은 일별 잔액을 더하지 않고 마지막 완료일의 원장 잔액으로 표시한다.
    return {
      ...flows,
      ...balances,
      unspent: balances.balance + balances.reserved,
      key,
      pending: days.includes(today),
      mismatchCount,
    };
  });
};

export const createBillingState = (today: string): BillingState => {
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
        createdAt: '2026-09-21T09:00:00+09:00',
        campaignId: 'CMP-' + (index + 1),
      },
      {
        id: 'L-SPEND-' + index,
        ownerId,
        type: 'SPEND',
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
      id: 'L-CREDIT-2',
      ownerId: 'OWN-002',
      type: 'INVALID_CREDIT',
      amount: 500,
      balanceDelta: 500,
      reservedDelta: 0,
      createdAt: '2026-09-22T09:00:00+09:00',
      campaignId: 'CMP-2',
      serveId: 'SERVE-1',
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
      createdAt: today + 'T09:00:00+09:00',
      campaignId: 'CMP-3',
    },
    {
      id: 'L-TODAY-SPEND',
      ownerId: 'OWN-003',
      type: 'SPEND',
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
