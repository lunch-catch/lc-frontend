export type InvalidReasonCode = 'EXPIRED_OR_UNKNOWN' | 'NOT_OWNER';
export type FraudTab = 'impressions' | 'requests';
export type FraudSortKey = 'campaignId' | 'userId' | 'reasonCode' | 'count';

export interface FraudSort {
  key: FraudSortKey;
  direction: 'asc' | 'desc';
}

// 두 조회 탭이 같은 테이블을 사용하며 캠페인·사유는 무효 노출 탭에서만 존재한다.
export interface FraudTableRow {
  id: string;
  userId: string;
  count: number;
  campaignId?: string;
  reasonCode?: InvalidReasonCode;
}

export interface ImpressionDailyAggregate {
  date: string;
  campaignId: string;
  userId: string;
  validCount: number;
  expiredOrUnknownCount: number;
  notOwnerCount: number;
  // 일별 의심 신호이며 기간 집계에서는 하나라도 감지된 캠페인을 검토 대상으로 표시한다.
  concentrated: boolean;
}

export interface FeedRejectionDailyAggregate {
  date: string;
  userId: string;
  count: number;
}

export interface FraudReport {
  impressions: ImpressionDailyAggregate[];
  feedRejections: FeedRejectionDailyAggregate[];
}

export interface FraudFilters {
  startDate: string;
  endDate: string;
  keyword: string;
  reasonCode: 'ALL' | InvalidReasonCode;
}

export interface CampaignFraudSummary {
  campaignId: string;
  totalCount: number;
  invalidCount: number;
  userCount: number;
  // 표시용 백분율이 아닌 0~1 비율로 저장해 경고 판정 전에 반올림하지 않는다.
  invalidRate: number;
  highInvalidRate: boolean;
  concentrated: boolean;
}

export interface InvalidImpressionRow {
  id: string;
  campaignId: string;
  userId: string;
  reasonCode: InvalidReasonCode;
  count: number;
}

export interface FeedRejectionRow {
  userId: string;
  count: number;
}

export interface FraudView {
  campaigns: CampaignFraudSummary[];
  invalidRows: InvalidImpressionRow[];
  rejectionRows: FeedRejectionRow[];
  expiredOrUnknownCount: number;
  notOwnerCount: number;
  rejectionCount: number;
}

export interface CampaignExposureUser {
  userId: string;
  totalCount: number;
  invalidCount: number;
}
