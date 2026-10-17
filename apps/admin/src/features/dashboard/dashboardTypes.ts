export type DashboardInterval = 'day' | 'week' | 'month';
export type UsageMetric = 'impressions' | 'saves' | 'issued' | 'used';
export type FunnelMetric = Exclude<UsageMetric, 'used'>;
export type BreakdownMetric = UsageMetric | 'spend';
export type BreakdownDimension = 'region' | 'category';

export interface DashboardRange {
  startDate: string;
  endDate: string;
}

export interface UsageCounts {
  impressions: number;
  saves: number;
  issued: number;
  used: number;
}

export interface UsageBreakdown extends UsageCounts {
  name: string;
  spend: number;
}

export interface DashboardSegment extends UsageCounts {
  region: string;
  category: string;
  spend: number;
}

/** 실제 API 응답과 분리된 화면 모델. 누적·상태 지표는 기간 말 스냅샷으로 읽는다. */
export interface DashboardDailyAggregate extends Omit<UsageCounts, 'used'> {
  date: string;
  totalImpressions: number;
  newUsers: number;
  newStores: number;
  totalUsers: number;
  totalStores: number;
  activeUsers: number;
  activeCampaigns: number;
  withdrawnUsers: number;
  suspendedUsers: number;
  charge: number;
  spend: number;
  refund: number;
  adjustment: number;
  unspent: number;
  mismatchCount: number;
  segments: DashboardSegment[];
}

export interface DashboardDataset {
  today: string;
  completedThrough: string;
  aggregatedAt: string;
  availableFrom: string;
  days: DashboardDailyAggregate[];
}

export interface DashboardSummary extends Omit<UsageCounts, 'used'> {
  totalImpressions: number;
  newUsers: number;
  newStores: number;
  activeUsers: number;
  charge: number;
  spend: number;
  refund: number;
  adjustment: number;
  mismatchCount: number;
}

export interface DashboardTrendPoint extends Omit<UsageCounts, 'used'> {
  label: string;
  charge: number;
  spend: number;
}
