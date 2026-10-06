export type CampaignStatus = 'SCHEDULED' | 'ACTIVE' | 'PAUSED' | 'ENDED';

export interface Campaign {
  ownerId: string;
  registeredAt: string;
  ageGroups: string;
  allocationImpressions: number;
  cumulativeSpent: number;
  cumulativeTarget: number;
  dailyBudget: number;
  endDate: string;
  gender: string;
  id: string;
  invalidImpressions: number;
  pausedReason?: string;
  posterDescription: string;
  posterImageUrl?: string;
  posterTitle: string;
  radius: number;
  relevanceImpressions: number;
  startDate: string;
  status: CampaignStatus;
  storeName: string;
  todaySpent: number;
  validImpressions: number;
}

export interface CampaignReport {
  campaignId: string;
  confirmedThrough: string;
  spentPoints: number;
  validImpressions: number;
}
