import type { PointSummaryPeriod } from '@admin/api/pointSummary';

const invalidRangeMessage =
  '합계 조회 기간의 시작일과 종료일을 올바르게 선택해 주세요.';

export const pointSummaryPeriods: {
  value: PointSummaryPeriod;
  label: string;
  limit: number;
  unit: string;
}[] = [
  { value: 'DAILY', label: '일별', limit: 92, unit: '일' },
  { value: 'WEEKLY', label: '주별', limit: 53, unit: '주' },
  { value: 'MONTHLY', label: '월별', limit: 13, unit: '개월' },
];

export const getPointSummaryRangeError = (
  from: string,
  to: string,
  period: PointSummaryPeriod,
) => {
  const start = Date.parse(from);
  const end = Date.parse(to);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(from) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(to) ||
    !Number.isFinite(start) ||
    !Number.isFinite(end) ||
    start > end
  )
    return invalidRangeMessage;
  if (
    new Date(start).toISOString().slice(0, 10) !== from ||
    new Date(end).toISOString().slice(0, 10) !== to
  )
    return invalidRangeMessage;
  let count = (end - start) / 86_400_000 + 1;
  if (period === 'WEEKLY') {
    // 서버는 월요일을 주의 시작으로 잡고, 일부만 포함된 주도 한 구간으로 센다.
    const monday = (timestamp: number) =>
      timestamp - ((new Date(timestamp).getUTCDay() + 6) % 7) * 86_400_000;
    count = (monday(end) - monday(start)) / (7 * 86_400_000) + 1;
  } else if (period === 'MONTHLY') {
    const monthIndex = (value: string) =>
      Number(value.slice(0, 4)) * 12 + Number(value.slice(5, 7));
    count = monthIndex(to) - monthIndex(from) + 1;
  }
  const option = pointSummaryPeriods.find((item) => item.value === period);
  if (!option) return '합계 집계 단위를 확인해 주세요.';
  return count > option.limit
    ? `${option.label} 합계는 최대 ${option.limit}${option.unit}까지 조회할 수 있습니다.`
    : '';
};
