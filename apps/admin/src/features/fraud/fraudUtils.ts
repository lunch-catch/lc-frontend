import type {
  CampaignExposureUser,
  CampaignFraudSummary,
  FeedRejectionRow,
  FraudFilters,
  FraudReport,
  FraudSort,
  FraudTableRow,
  FraudView,
  InvalidImpressionRow,
  InvalidReasonCode,
} from './fraudTypes';

interface CampaignAggregate {
  totalCount: number;
  invalidCount: number;
  users: Set<string>;
  concentrated: boolean;
}

export const invalidReasonDescriptions: Record<InvalidReasonCode, string> = {
  EXPIRED_OR_UNKNOWN: '노출 인정 시간 초과 또는 미발급으로 serve 기록 없음',
  NOT_OWNER: '다른 사용자의 serve_id 사용',
};

// YYYY-MM-DD 형식의 날짜를 비교하며 시작일과 종료일을 모두 포함한다.
const isInPeriod = (date: string, filters: FraudFilters) =>
  (!filters.startDate || date >= filters.startDate) &&
  (!filters.endDate || date <= filters.endDate);

export const getCampaignExposureUsers = (
  report: FraudReport,
  filters: FraudFilters,
  campaignId: string,
): CampaignExposureUser[] => {
  // 집중 노출 검토에는 검색 조건으로 가려진 사용자와 유효 노출도 함께 필요하다.
  const users = new Map<string, CampaignExposureUser>();
  for (const row of report.impressions) {
    if (row.campaignId !== campaignId || !isInPeriod(row.date, filters))
      continue;
    const user = users.get(row.userId) ?? {
      userId: row.userId,
      totalCount: 0,
      invalidCount: 0,
    };
    const invalidCount = row.expiredOrUnknownCount + row.notOwnerCount;
    user.totalCount += row.validCount + invalidCount;
    user.invalidCount += invalidCount;
    users.set(row.userId, user);
  }
  return Array.from(users.values()).sort(
    (first, second) => second.totalCount - first.totalCount,
  );
};

export const buildFraudView = (
  report: FraudReport,
  filters: FraudFilters,
): FraudView => {
  const campaignGroups = new Map<string, CampaignAggregate>();
  const invalidGroups = new Map<string, InvalidImpressionRow>();
  const rejectionGroups = new Map<string, FeedRejectionRow>();
  const keyword = filters.keyword.trim().toLowerCase();
  const matchedCampaignIds = new Set<string>();

  for (const row of report.impressions) {
    if (!isInPeriod(row.date, filters)) continue;

    const invalidCount = row.expiredOrUnknownCount + row.notOwnerCount;
    const campaign = campaignGroups.get(row.campaignId) ?? {
      totalCount: 0,
      invalidCount: 0,
      users: new Set<string>(),
      concentrated: false,
    };
    campaign.totalCount += row.validCount + invalidCount;
    campaign.invalidCount += invalidCount;
    if (row.validCount + invalidCount > 0) campaign.users.add(row.userId);
    campaign.concentrated ||= row.concentrated;
    campaignGroups.set(row.campaignId, campaign);

    // 하나의 검색어가 캠페인 ID 또는 사용자 ID 중 하나에 일치하면 포함한다.
    const matchesKeyword = [row.campaignId, row.userId].some((value) =>
      value.toLowerCase().includes(keyword),
    );
    if (!matchesKeyword) continue;
    matchedCampaignIds.add(row.campaignId);
    const reasons: [InvalidReasonCode, number][] = [
      ['EXPIRED_OR_UNKNOWN', row.expiredOrUnknownCount],
      ['NOT_OWNER', row.notOwnerCount],
    ];
    for (const [reasonCode, count] of reasons) {
      if (
        count === 0 ||
        (filters.reasonCode !== 'ALL' && reasonCode !== filters.reasonCode)
      )
        continue;
      // 날짜가 달라도 같은 캠페인·사용자·사유는 선택 기간의 한 행으로 합산한다.
      const id = `${row.campaignId}:${row.userId}:${reasonCode}`;
      const aggregate = invalidGroups.get(id) ?? {
        id,
        campaignId: row.campaignId,
        userId: row.userId,
        reasonCode,
        count: 0,
      };
      aggregate.count += count;
      invalidGroups.set(id, aggregate);
    }
  }

  // 피드 요청은 캠페인과 관계없으므로 사용자 ID로만 검색하고 무효 사유는 적용하지 않는다.
  for (const row of report.feedRejections) {
    if (
      !isInPeriod(row.date, filters) ||
      !row.userId.toLowerCase().includes(keyword) ||
      row.count === 0
    )
      continue;
    const aggregate = rejectionGroups.get(row.userId) ?? {
      userId: row.userId,
      count: 0,
    };
    aggregate.count += row.count;
    rejectionGroups.set(row.userId, aggregate);
  }

  // 사용자·사유 필터로 분모가 줄어 경고 비율이 바뀌지 않도록 캠페인 전체 집계를 유지한다.
  const campaigns: CampaignFraudSummary[] = Array.from(
    campaignGroups,
    ([campaignId, group]) => {
      const invalidRate =
        group.totalCount === 0 ? 0 : group.invalidCount / group.totalCount;
      return {
        campaignId,
        totalCount: group.totalCount,
        invalidCount: group.invalidCount,
        userCount: group.users.size,
        invalidRate,
        // 정확히 20%인 경우는 제외하고 원본 비율이 20%를 넘을 때만 경고한다.
        highInvalidRate: invalidRate > 0.2,
        concentrated: group.concentrated,
      };
    },
  ).filter((campaign) => matchedCampaignIds.has(campaign.campaignId));
  const invalidRows = Array.from(invalidGroups.values());
  const rejectionRows = Array.from(rejectionGroups.values());
  return {
    campaigns,
    invalidRows,
    rejectionRows,
    expiredOrUnknownCount: invalidRows
      .filter((row) => row.reasonCode === 'EXPIRED_OR_UNKNOWN')
      .reduce((sum, row) => sum + row.count, 0),
    notOwnerCount: invalidRows
      .filter((row) => row.reasonCode === 'NOT_OWNER')
      .reduce((sum, row) => sum + row.count, 0),
    rejectionCount: rejectionRows.reduce((sum, row) => sum + row.count, 0),
  };
};

export const sortFraudRows = (
  rows: FraudTableRow[],
  sort: FraudSort | null,
): FraudTableRow[] => {
  if (!sort) return rows;
  // 집계 결과를 직접 정렬하지 않아 다른 요약·상세 화면의 순서를 바꾸지 않는다.
  return [...rows].sort((first, second) => {
    const firstValue = first[sort.key] ?? '';
    const secondValue = second[sort.key] ?? '';
    const comparison =
      typeof firstValue === 'number' && typeof secondValue === 'number'
        ? firstValue - secondValue
        : String(firstValue).localeCompare(String(secondValue), 'ko');
    return sort.direction === 'asc' ? comparison : -comparison;
  });
};
