import { DateRangePicker, type DateRangePickerProps } from '@repo/ui';

import { getKstToday } from '@admin/hooks/queryDateUtils';

/** 관리자 조회에만 KST 오늘 상한을 적용하며 공용 컴포넌트의 기본 동작은 유지한다. */
export const AdminDateRangePicker = ({
  maxDate,
  ...props
}: Omit<DateRangePickerProps, 'todayDate'>) => {
  // 상한과 오늘 강조·단축 버튼이 같은 날짜를 보도록 KST 오늘을 한 번만 계산한다.
  const kstToday = getKstToday();

  // 집계 화면은 어제처럼 더 이른 상한을 지정할 수 있지만 오늘을 넘길 수는 없다.
  const limit = maxDate && maxDate < kstToday ? maxDate : kstToday;
  return <DateRangePicker {...props} maxDate={limit} todayDate={kstToday} />;
};
