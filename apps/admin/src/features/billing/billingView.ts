import type { Dispatch, ReactNode, SetStateAction } from 'react';
import type { DateRangeValue } from '@repo/ui';

import type {
  DataTableColumn,
  TableDensity,
} from '@admin/components/DataTable';

import type { BillingState } from './billingTypes';

export const getMonthRange = (today: string): DateRangeValue => {
  const [year, month] = today.split('-').map(Number);
  return {
    startDate: `${today.slice(0, 7)}-01`,
    endDate: new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10),
  };
};
export interface BillingTablePreferences {
  density: TableDensity;
  setDensity: Dispatch<SetStateAction<TableDensity>>;
  pageSize: number;
  setPageSize: Dispatch<SetStateAction<number>>;
}
export interface BillingTabProps {
  state: BillingState;
  today: string;
  preferences: BillingTablePreferences;
}
export interface BillingCell {
  content: ReactNode;
  // 표시 요소와 정렬값을 분리해 배지·단위가 붙은 금액도 원래 값으로 정렬한다.
  value: string | number;
  title?: string;
}
export interface BillingRecord {
  id: string;
  date: string;
  status: string;
  search: string;
  cells: BillingCell[];
}
export interface BillingColumn {
  align?: DataTableColumn['align'];
  label: string;
  width: number;
}
export const cell = (
  content: ReactNode,
  value: string | number,
  title?: string,
): BillingCell => ({
  content,
  value,
  title: title ?? (typeof content === 'string' ? content : undefined),
});
