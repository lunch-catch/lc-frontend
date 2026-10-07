export type CampaignStatus = 'SCHEDULED' | 'ACTIVE' | 'PAUSED' | 'ENDED';

export interface Campaign {
  ownerId: string;
  registeredAt: string;
  dailyBudget: number;
  endDate: string;
  id: string;
  startDate: string;
  status: CampaignStatus;
  storeName: string;
}

export interface CampaignReport {
  campaignId: string;
  confirmedThrough: string;
  spentPoints: number;
  validImpressions: number;
}
