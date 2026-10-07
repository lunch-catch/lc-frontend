export type DashboardInterval = 'day' | 'week' | 'month';
export type UsageMetric = 'impressions' | 'saves' | 'issued' | 'used';
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
}

export interface DashboardDailyAggregate extends UsageCounts {
  date: string;
  totalImpressions: number;
  newUsers: number;
  newStores: number;
  totalUsers: number;
  totalStores: number;
  charge: number;
  spend: number;
  unspent: number;
  mismatchCount: number;
  regions: UsageBreakdown[];
  categories: UsageBreakdown[];
}

export interface DashboardDataset {
  today: string;
  completedThrough: string;
  aggregatedAt: string;
  availableFrom: string;
  days: DashboardDailyAggregate[];
}

export interface DashboardSummary extends UsageCounts {
  totalImpressions: number;
  newUsers: number;
  newStores: number;
  charge: number;
  spend: number;
  mismatchCount: number;
}

export interface DashboardTrendPoint extends UsageCounts {
  label: string;
  charge: number;
  spend: number;
}
