import { ApiError } from './client';

export interface BillingPage<T> {
  items: T[];
  page: number;
  size: number;
  totalElements: number;
}

export const isBillingRecord = (
  value: unknown,
): value is Record<string, unknown> =>
  value !== null && typeof value === 'object';
export const isBillingInteger = (value: unknown): value is number =>
  typeof value === 'number' && Number.isSafeInteger(value);
export const isBillingId = (value: unknown): value is number =>
  isBillingInteger(value) && value > 0;
export const isBillingText = (value: unknown) =>
  value === null || typeof value === 'string';
export const isOptionalBillingId = (value: unknown) =>
  value === null || isBillingId(value);

/** 항목과 페이지 정보를 함께 검증해 잘못된 목록 응답이 화면 상태에 들어오지 않도록 한다. */
export const readBillingPage = <T>(
  data: unknown,
  isItem: (value: unknown) => value is T,
): BillingPage<T> => {
  if (
    !isBillingRecord(data) ||
    !Array.isArray(data.items) ||
    !data.items.every(isItem) ||
    !isBillingInteger(data.page) ||
    data.page < 0 ||
    !isBillingId(data.size) ||
    !isBillingInteger(data.totalElements) ||
    data.totalElements < data.items.length ||
    data.items.length > data.size
  )
    throw new ApiError('목록 응답 형식을 확인할 수 없습니다.', 200);
  return data as unknown as BillingPage<T>;
};
