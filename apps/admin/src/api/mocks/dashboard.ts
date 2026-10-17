import type {
  DashboardDailyAggregate,
  DashboardDataset,
  DashboardSegment,
  UsageCounts,
} from '@admin/features/dashboard/dashboardTypes';
import { shiftDate } from '@admin/features/dashboard/dashboardUtils';

const createSegments = (
  counts: UsageCounts,
  spend: number,
  seed: number,
): DashboardSegment[] => {
  const names = [
    '강남구',
    '서초구',
    '마포구',
    '영등포구',
    '종로구',
    '중구',
  ].flatMap((region) =>
    ['한식', '일식', '중식', '양식', '분식', '기타'].map((category) => ({
      region,
      category,
    })),
  );
  const weights = names.map((_, index) => 10 + ((seed + index * 7) % 19));
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  const values = { ...counts, spend };
  const remaining = { ...values };
  return names.map((name, index) => {
    const row = {
      ...name,
      impressions: 0,
      saves: 0,
      issued: 0,
      used: 0,
      spend: 0,
    };
    for (const key of [
      'impressions',
      'saves',
      'issued',
      'used',
      'spend',
    ] as const) {
      // 마지막 구간에 정수 배분 잔여분을 배정해 전체 집계와 합계를 맞춘다.
      row[key] =
        index === names.length - 1
          ? remaining[key]
          : Math.floor((values[key] * weights[index]) / total);
      remaining[key] -= row[key];
    }
    return row;
  });
};

export const getMockDashboard = async (): Promise<DashboardDataset> => {
  await new Promise((resolve) => setTimeout(resolve, 250));
  const today = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Seoul',
  }).format(new Date());
  const completedThrough = shiftDate(today, -1);
  const availableFrom = shiftDate(today, -430);
  const days: DashboardDailyAggregate[] = [];
  let totalUsers = 4200;
  let totalStores = 240;
  let unspent = 3_500_000;
  for (let index = 0; index < 430; index += 1) {
    const date = shiftDate(availableFrom, index);
    const weekend = [0, 6].includes(new Date(`${date}T00:00:00Z`).getUTCDay());
    const impressions = Math.round(
      (5400 + index * 12 + ((index * 37) % 1700)) * (weekend ? 0.38 : 1),
    );
    const counts = {
      impressions,
      saves: Math.round(impressions * (0.21 + (index % 5) * 0.01)),
      issued: Math.round(impressions * 0.14),
      used: Math.round(impressions * (0.08 + (index % 4) * 0.006)),
    };
    const newUsers = 12 + (index % 31);
    const newStores = index % 3;
    const charge = 90_000 + (index % 7) * 20_000;
    const spend = impressions * 10;
    const refund = index % 9 === 0 ? 10_000 : 0;
    const adjustment = index % 19 === 0 ? -1_000 : 0;
    totalUsers += newUsers;
    totalStores += newStores;
    unspent += charge - spend - refund + adjustment;
    days.push({
      impressions: counts.impressions,
      saves: counts.saves,
      issued: counts.issued,
      date,
      totalImpressions: impressions + 120 + (index % 90),
      newUsers,
      newStores,
      totalUsers,
      totalStores,
      activeUsers: Math.round(impressions * 0.32),
      activeCampaigns: 45 + (index % 31),
      withdrawnUsers: 80 + Math.floor(index / 5),
      // 명세상 계정 정지 기능은 구현 제외이므로 예시에서도 정지 수를 0으로 유지한다.
      suspendedUsers: 0,
      charge,
      spend,
      refund,
      adjustment,
      unspent,
      mismatchCount: index % 29 === 0 ? 1 : 0,
      segments: createSegments(counts, spend, index),
    });
  }
  return {
    today,
    completedThrough,
    aggregatedAt: new Date().toISOString(),
    availableFrom,
    days,
  };
};
