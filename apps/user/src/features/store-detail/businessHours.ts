import type { DayOfWeek, StoreBusinessHour } from '@user/api/store';

export const DAY_LABELS: Record<DayOfWeek, string> = {
  MONDAY: '월',
  TUESDAY: '화',
  WEDNESDAY: '수',
  THURSDAY: '목',
  FRIDAY: '금',
  SATURDAY: '토',
  SUNDAY: '일',
};

// Date.getDay() 순서 (일요일이 0)
const DAYS_BY_DATE_INDEX: DayOfWeek[] = [
  'SUNDAY',
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
];

export type OpenStatus = 'open' | 'break' | 'beforeOpen' | 'closed' | 'dayOff';

export const OPEN_STATUS_LABELS: Record<OpenStatus, string> = {
  open: '영업 중',
  break: '브레이크타임',
  beforeOpen: '영업 전',
  closed: '영업 종료',
  dayOff: '오늘 휴무',
};

// HH:MM을 비교하기 쉽게 분으로 바꾼다
const toMinutes = (time: string) => {
  const [hours = 0, minutes = 0] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

export const getTodayHour = (hours: StoreBusinessHour[], now: number) => {
  const today = DAYS_BY_DATE_INDEX[new Date(now).getDay()];
  return hours.find((hour) => hour.dayOfWeek === today);
};

// 지금 시각 기준 영업 상태. 오늘 영업시간이 등록되지 않았으면 휴무로 본다
export const getOpenStatus = (
  hour: StoreBusinessHour | undefined,
  now: number,
): OpenStatus => {
  if (!hour || hour.isClosed || !hour.openTime || !hour.closeTime) {
    return 'dayOff';
  }

  const date = new Date(now);
  const current = date.getHours() * 60 + date.getMinutes();

  if (current < toMinutes(hour.openTime)) return 'beforeOpen';
  if (current >= toMinutes(hour.closeTime)) return 'closed';
  if (
    hour.breakStartTime &&
    hour.breakEndTime &&
    current >= toMinutes(hour.breakStartTime) &&
    current < toMinutes(hour.breakEndTime)
  ) {
    return 'break';
  }
  return 'open';
};
