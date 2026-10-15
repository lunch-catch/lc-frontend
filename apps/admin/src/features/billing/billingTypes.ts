export type LedgerType =
  'CHARGE' | 'RESERVE' | 'DEDUCT' | 'RELEASE' | 'ADJUST' | 'REFUND';
export type ReportPeriod = 'day' | 'week' | 'month';

export interface LedgerEntry {
  id: string;
  ownerId: string;
  type: LedgerType;
  amount: number;
  balanceDelta: number;
  reservedDelta: number;
  createdAt: string;
  campaignId?: string;
  serveId?: string;
  transactionId?: string;
  reason?: string;
}

export interface BillingState {
  ledger: LedgerEntry[];
}

export interface Totals {
  charge: number;
  reserve: number;
  spend: number;
  release: number;
  adjustment: number;
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
  adjustment: number;
  refund: number;
  unspent: number;
}
