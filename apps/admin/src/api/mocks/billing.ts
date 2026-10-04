import { createBillingState } from '@admin/features/billing/billingData';
import type { BillingState } from '@admin/features/billing/billingTypes';

export const createMockBillingState = (today: string): BillingState =>
  createBillingState(today);
