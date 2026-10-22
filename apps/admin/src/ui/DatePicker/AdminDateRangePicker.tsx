import { DateRangePicker, type DateRangePickerProps } from '@repo/ui';

import { getKstToday } from '@admin/hooks/queryDateUtils';

/** 관리자 조회에만 KST 오늘 상한을 적용하며 공용 컴포넌트의 기본 동작은 유지한다. */
export const AdminDateRangePicker = (
  props: Omit<DateRangePickerProps, 'maxDate'>,
) => <DateRangePicker {...props} maxDate={getKstToday()} />;
