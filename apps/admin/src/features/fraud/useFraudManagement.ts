import { useState } from 'react';

import { getCampaignWarnings, getInvalidImpressions } from '@admin/api/fraud';
import {
  queryChoice,
  queryDate,
  queryPage,
  querySize,
  queryText,
} from '@admin/hooks/urlQuery';
import { useApiResource } from '@admin/hooks/useApiResource';
import { useUrlFilters } from '@admin/hooks/useUrlFilters';
import { useUrlSearch } from '@admin/hooks/useUrlSearch';
import type { TableDensity } from '@admin/ui/DataTable';

import { getFraudRangeError } from './fraudUtils';

export const useFraudManagement = () => {
  const { filters, updateFilters } = useUrlFilters('fraud.', {
    tab: queryChoice(['impressions', 'warnings'] as const, 'impressions'),
    from: queryDate(),
    to: queryDate(),
    reason: queryChoice(
      ['ALL', 'EXPIRED_OR_UNKNOWN', 'NOT_OWNER'] as const,
      'ALL',
    ),
    type: queryChoice(
      ['ALL', 'INVALID_RATIO', 'CONCENTRATION'] as const,
      'ALL',
    ),
    campaignId: queryText(),
    memberId: queryText(),
    page: queryPage,
    size: querySize,
    sortBy: queryChoice(
      [
        '',
        'count',
        'campaignId',
        'memberId',
        'invalidRatio',
        'topMembersShare',
      ] as const,
      '',
    ),
    sortDir: queryChoice(['asc', 'desc'] as const, 'desc'),
  });
  const campaign = useUrlSearch(filters.campaignId, (campaignId) =>
    updateFilters({ campaignId, page: 1 }),
  );
  const member = useUrlSearch(filters.memberId, (memberId) =>
    updateFilters({ memberId, page: 1 }),
  );
  const [density, setDensity] = useState<TableDensity>('normal');
  const idError =
    filters.tab === 'impressions' &&
    [filters.campaignId, filters.memberId].some(
      (value) =>
        value.trim() &&
        (!/^[1-9]\d*$/.test(value.trim()) ||
          !Number.isSafeInteger(Number(value))),
    )
      ? '캠페인 ID와 사용자 ID는 양의 정수로 입력해 주세요.'
      : '';
  const validation = getFraudRangeError(filters.from, filters.to) || idError;
  const allowedSorts =
    filters.tab === 'impressions'
      ? ['count', 'campaignId', 'memberId']
      : ['invalidRatio', 'topMembersShare', 'campaignId'];
  const sortBy = allowedSorts.includes(filters.sortBy)
    ? filters.sortBy
    : filters.tab === 'impressions'
      ? 'count'
      : 'invalidRatio';
  const params = new URLSearchParams({
    from: filters.from,
    to: filters.to,
    page: String(filters.page - 1),
    size: String(filters.size),
    sortBy,
    sortDir: filters.sortDir,
  });
  if (filters.tab === 'impressions') {
    if (filters.reason !== 'ALL') params.set('reasonCode', filters.reason);
    if (filters.campaignId.trim())
      params.set('campaignId', filters.campaignId.trim());
    if (filters.memberId.trim())
      params.set('memberId', filters.memberId.trim());
  } else if (filters.type !== 'ALL') params.set('type', filters.type);
  const invalid = useApiResource(
    getInvalidImpressions,
    !validation && filters.tab === 'impressions' ? params.toString() : null,
  );
  const warnings = useApiResource(
    getCampaignWarnings,
    !validation && filters.tab === 'warnings' ? params.toString() : null,
  );
  const resource = filters.tab === 'impressions' ? invalid : warnings;
  const pagination = {
    currentPage: filters.page,
    pageSize: filters.size,
    totalCount: resource.data?.totalElements ?? 0,
    totalPages: Math.ceil((resource.data?.totalElements ?? 0) / filters.size),
    onPageChange: (page: number) => updateFilters({ page }),
    onPageSizeChange: (size: number) => updateFilters({ size, page: 1 }),
  };
  const sort = (
    key:
      'count' | 'campaignId' | 'memberId' | 'invalidRatio' | 'topMembersShare',
  ) =>
    updateFilters({
      sortBy: key,
      sortDir: key === sortBy && filters.sortDir === 'desc' ? 'asc' : 'desc',
      page: 1,
    });
  return {
    filters,
    updateFilters,
    campaign,
    member,
    invalid,
    warnings,
    resource,
    validation,
    density,
    setDensity,
    pagination,
    sortBy,
    sort,
  };
};
