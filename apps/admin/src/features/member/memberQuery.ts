import {
  queryChoice,
  queryPage,
  queryPastDate,
  querySize,
  queryText,
} from '@admin/hooks/urlQuery';

const listQuery = {
  keyword: queryText(),
  status: queryChoice(
    ['ALL', 'ACTIVE', 'SUSPENDED', 'WITHDRAWN'] as const,
    'ALL',
  ),
  from: queryPastDate(),
  to: queryPastDate(),
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
