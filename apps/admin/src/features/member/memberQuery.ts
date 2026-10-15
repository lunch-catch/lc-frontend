import {
  queryChoice,
  queryDate,
  queryPage,
  querySize,
  queryText,
} from '@admin/hooks/urlQuery';

const listQuery = {
  keyword: queryText(),
  status: queryChoice(
    ['ALL', 'ACTIVE', 'SUSPENDED', 'WITHDRAWN'] as const,
    'ALL',
  ),
  from: queryDate(),
  to: queryDate(),
  page: queryPage,
  size: querySize,
  sortDir: queryChoice(['asc', 'desc'] as const, 'desc'),
};

export const memberQuery = {
  ...listQuery,
  sortBy: queryChoice(
    ['', 'memberId', 'nickname', 'joinedAt', 'lastLoginAt'] as const,
    '',
  ),
};

export const ownerQuery = {
  ...listQuery,
  sortBy: queryChoice(
    [
      '',
      'id',
      'storeName',
      'status',
      'storeRegistrationCompleted',
      'joinedAt',
      'lastAccessedAt',
    ] as const,
    '',
  ),
};
