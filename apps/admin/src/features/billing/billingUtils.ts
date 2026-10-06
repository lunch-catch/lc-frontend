import type {
  BillingState,
  DailyCache,
  LedgerEntry,
  LedgerRow,
  LedgerType,
  RefundRequest,
  RefundStatus,
  ReportPeriod,
  ReportRow,
  Totals,
} from './billingTypes';

export const paymentStatusLabels = {
  PENDING: '결제 대기',
  SUCCESS: '결제 성공',
  FAILED: '결제 실패',
  CANCELED: '취소됨',
  UNKNOWN: '확인 필요',
};

export const ledgerTypeLabels: Record<LedgerType, string> = {
  CHARGE: '충전',
  RESERVE: '예약',
  DEDUCT: '소진',
  RELEASE: '예약 해제',
  ADJUST: '조정',
  REFUND: '환불',
};

export const refundStatusLabels: Record<RefundStatus, string> = {
  REQUESTED: '요청',
  APPROVED: '승인',
  REJECTED: '반려',
};

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
        beforeReserved: previous.reserved,
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
  const { balance, reserved } = getBalance(ledger, ownerId, end);
  return {
    charge: sum('CHARGE'),
    reserve: sum('RESERVE'),
    spend: sum('DEDUCT'),
    release: sum('RELEASE'),
    adjustment: entries
      .filter((entry) => entry.type === 'ADJUST')
      .reduce(
        (total, entry) => total + entry.balanceDelta + entry.reservedDelta,
        0,
      ),
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
        adjustment: totals.adjustment,
        refund: totals.refund,
        unspent: totals.unspent,
      };
    });

const reportMetricKeys: (keyof Omit<DailyCache, 'date'>)[] = [
  'charge',
  'spend',
  'adjustment',
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
