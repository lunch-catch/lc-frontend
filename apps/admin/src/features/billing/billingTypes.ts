export type PaymentStatus =
  'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELED' | 'UNKNOWN';
export type LedgerType =
  'CHARGE' | 'RESERVE' | 'DEDUCT' | 'RELEASE' | 'ADJUST' | 'REFUND';
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
  amount: number;
  balanceDelta: number;
  reservedDelta: number;
  createdAt: string;
  campaignId?: string;
  serveId?: string;
  transactionId?: string;
  reason?: string;
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
  beforeReserved: number;
  afterReserved: number;
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
