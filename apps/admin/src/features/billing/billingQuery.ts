import {
  queryChoice,
  queryDate,
  queryPage,
  querySize,
  queryText,
} from '@admin/hooks/urlQuery';

export const paymentQuery = {
  keyword: queryText(),
  searchType: queryChoice(
    ['OWNER_ID', 'ORDER_ID', 'PG_TID'] as const,
    'OWNER_ID',
  ),
  status: queryChoice(
    ['ALL', 'REQUESTED', 'APPROVED', 'FAILED', 'CANCELLED', 'UNKNOWN'] as const,
    'ALL',
  ),
  from: queryDate(),
  to: queryDate(),
  page: queryPage,
  size: querySize,
  sortBy: queryChoice(['', 'requestedAt', 'amount', 'approvedAt'] as const, ''),
  sortDir: queryChoice(['asc', 'desc'] as const, 'desc'),
};

export const getLedgerQuery = (from: string, to: string) => ({
  ownerId: queryText(),
  campaignId: queryText(),
  type: queryChoice(
    [
      'ALL',
      'CHARGE',
      'RESERVE',
      'DEDUCT',
      'RELEASE',
      'ADJUST',
      'REFUND',
    ] as const,
    'ALL',
  ),
  from: queryDate(from),
  to: queryDate(to),
  size: querySize,
  sortDir: queryChoice(['asc', 'desc'] as const, 'desc'),
});

export const getSummaryQuery = (from: string, to: string) => ({
  period: queryChoice(['DAILY', 'WEEKLY', 'MONTHLY'] as const, 'DAILY'),
  from: queryDate(from),
  to: queryDate(to),
  sortDir: queryChoice(['asc', 'desc'] as const, 'desc'),
});
