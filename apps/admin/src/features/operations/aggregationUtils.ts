import { ApiError } from '@admin/api/client';

export const getOperationsToday = () =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());

export const getRecalculationDateError = (
  businessDate: string,
  today = getOperationsToday(),
) => {
  if (!businessDate) return '영업일을 선택해 주세요.';
  if (businessDate >= today)
    return '재집계는 어제까지의 영업일만 요청할 수 있습니다.';
  const current = new Date(today + 'T00:00:00Z');
  const day = current.getUTCDate();
  current.setUTCDate(1);
  current.setUTCMonth(current.getUTCMonth() - 13);
  // LocalDate.minusMonths와 같이 말일을 해당 월의 마지막 날로 맞춘다.
  const lastDay = new Date(
    Date.UTC(current.getUTCFullYear(), current.getUTCMonth() + 1, 0),
  ).getUTCDate();
  current.setUTCDate(Math.min(day, lastDay));
  return businessDate < current.toISOString().slice(0, 10)
    ? '13개월보다 오래된 영업일은 재집계할 수 없습니다.'
    : '';
};
export const getRecalculationError = (cause: unknown) => {
  if (!(cause instanceof ApiError))
    return '재집계 요청을 보내지 못했습니다. 연결 상태를 확인해 주세요.';
  if (cause.code === 'ANALYTICS-002')
    return '재집계할 수 없는 영업일입니다. 어제까지, 보존 기간 13개월 이내의 날짜를 선택해 주세요.';
  if (cause.code === 'ANALYTICS-003')
    return '해당 영업일의 집계가 이미 실행 중입니다. 실행 상태를 다시 확인해 주세요.';
  return cause.message;
};
