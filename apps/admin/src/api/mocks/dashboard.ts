import type {
  DashboardDailyAggregate,
  DashboardDataset,
  UsageCounts,
} from '@admin/features/dashboard/dashboardTypes';
import { shiftDate } from '@admin/features/dashboard/dashboardUtils';

const splitCounts = (counts: UsageCounts, names: string[], seed: number) => {
  const weights = names.map((_, index) => 10 + ((seed + index * 7) % 19));
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  const remaining = { ...counts };
  return names.map((name, index) => {
    const row = { name, impressions: 0, saves: 0, issued: 0, used: 0 };
    for (const key of ['impressions', 'saves', 'issued', 'used'] as const) {
      row[key] =
        index === names.length - 1
          ? remaining[key]
          : Math.floor((counts[key] * weights[index]) / total);
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
  const availableFrom = shiftDate(today, -365);
  const days: DashboardDailyAggregate[] = [];
  let totalUsers = 4200;
  let totalStores = 240;
  let unspent = 3_500_000;
  for (let index = 0; index < 365; index += 1) {
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
    totalUsers += newUsers;
    totalStores += newStores;
    unspent += charge - spend;
    days.push({
      ...counts,
      date,
      totalImpressions: impressions + 120 + (index % 90),
      newUsers,
      newStores,
      totalUsers,
      totalStores,
      charge,
      spend,
      unspent,
      mismatchCount: index % 29 === 0 ? 1 : 0,
      regions: splitCounts(
        counts,
        ['강남구', '서초구', '마포구', '영등포구', '종로구', '중구'],
        index,
      ),
      categories: splitCounts(
        counts,
        ['한식', '일식', '중식', '양식', '분식', '기타'],
        index + 5,
      ),
    });
  }
  return {
    today,
    completedThrough,
    aggregatedAt: `${today} 02:00 KST`,
    availableFrom,
    days,
  };
};
