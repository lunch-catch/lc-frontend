import type { MemberStatus } from './memberTypes';

export const isIncludedInDateRange = (
  joinedAt: string,
  startDate: string,
  endDate: string,
) => {
  if (startDate && joinedAt < startDate) {
    return false;
  }

  return !endDate || joinedAt <= endDate;
};

export const getMaskedValue = (value: string, status: MemberStatus) =>
  status === 'WITHDRAWN' ? '***' : value;
