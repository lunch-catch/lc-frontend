export type AnalyticsInterval = 'day' | 'week' | 'month';
interface AnalyticsRange {
  startDate: string;
  endDate: string;
}
export const analyticsRangeLimits = { day: 92, week: 53, month: 13 };

/** 선택 기간이 걸치는 일·주·월 구간 수를 기준으로 조회 한도를 검증한다. */
export const getAnalyticsRangeError = (
  range: AnalyticsRange,
  interval: AnalyticsInterval,
) => {
  const start = Date.parse(range.startDate);
  const end = Date.parse(range.endDate);
  if (!Number.isFinite(start) || !Number.isFinite(end) || start > end)
    return '시작일과 종료일을 올바르게 선택해 주세요.';
  const startBucket = getBucketKey(range.startDate, interval);
  const endBucket = getBucketKey(range.endDate, interval);
  if (interval === 'month') {
    const monthIndex = (date: string) =>
      Number(date.slice(0, 4)) * 12 + Number(date.slice(5, 7));
    return monthIndex(endBucket) - monthIndex(startBucket) >=
      analyticsRangeLimits.month
      ? `월별 조회는 최대 ${analyticsRangeLimits.month}개월까지 가능합니다.`
      : '';
  }
  const count = (Date.parse(endBucket) - Date.parse(startBucket)) / 86_400_000;
  if (interval === 'week')
    return count / 7 >= analyticsRangeLimits.week
      ? `주별 조회는 최대 ${analyticsRangeLimits.week}주까지 가능합니다.`
      : '';
  return count >= analyticsRangeLimits.day
    ? `일별 조회는 최대 ${analyticsRangeLimits.day}일까지 가능합니다.`
    : '';
};

export const shiftDate = (value: string, amount: number) => {
  const date = new Date(`${value}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
};

export const getPreviousRange = (range: AnalyticsRange): AnalyticsRange => {
  const length =
    Math.round(
      (Date.parse(range.endDate) - Date.parse(range.startDate)) / 86_400_000,
    ) + 1;
  return {
    startDate: shiftDate(range.startDate, -length),
    endDate: shiftDate(range.startDate, -1),
  };
};

export const getBucketKey = (date: string, interval: AnalyticsInterval) => {
  if (interval === 'month') return date.slice(0, 7);
  if (interval === 'week') {
    const weekday = new Date(`${date}T00:00:00Z`).getUTCDay();
    return shiftDate(date, -((weekday + 6) % 7));
  }
  return date;
};
