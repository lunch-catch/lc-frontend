import type {
  DailyCache,
  LedgerEntry,
  LedgerType,
  ReportPeriod,
  ReportRow,
  Totals,
} from './billingTypes';

export const ledgerTypeLabels: Record<LedgerType, string> = {
  CHARGE: '충전',
  RESERVE: '예약',
  DEDUCT: '소진',
  RELEASE: '예약 해제',
  ADJUST: '조정',
  REFUND: '환불',
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
