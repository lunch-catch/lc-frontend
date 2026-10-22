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
  // 기본 정렬을 요청과 열 헤더에 명시해 가입일 최신순임을 함께 표시한다.
  sortBy: queryChoice(
    ['', 'memberId', 'nickname', 'joinedAt', 'lastLoginAt'] as const,
    'joinedAt',
  ),
};
