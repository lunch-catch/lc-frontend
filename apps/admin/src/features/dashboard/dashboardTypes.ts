export type DashboardInterval = 'day' | 'week' | 'month';
export type UsageMetric = 'impressions' | 'saves' | 'issued' | 'used';
export type FunnelMetric = UsageMetric;
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

/** 아직 API가 없는 이용현황 전용 예시 모델. */
export interface DashboardDailyAggregate {
  date: string;
  segments: DashboardSegment[];
}

export interface DashboardDataset {
  today: string;
  completedThrough: string;
  availableFrom: string;
  days: DashboardDailyAggregate[];
}
