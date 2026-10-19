import { ApiError } from './client';

export interface ListPage<T> {
  items: T[];
  page: number;
  size: number;
  totalElements: number;
}
export const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object';
export const isInteger = (value: unknown): value is number =>
  typeof value === 'number' && Number.isSafeInteger(value);
export const isCount = (value: unknown): value is number =>
  isInteger(value) && value >= 0;
export const isId = (value: unknown): value is number =>
  isInteger(value) && value > 0;
export const isNullableText = (value: unknown) =>
  value === null || typeof value === 'string';
export const readListPage = <T>(
  data: unknown,
  isItem: (value: unknown) => value is T,
): ListPage<T> => {
  if (
    !isRecord(data) ||
    !Array.isArray(data.items) ||
    !data.items.every(isItem) ||
    !isCount(data.page) ||
    !isId(data.size) ||
    !isCount(data.totalElements) ||
    data.items.length > data.size ||
    data.items.length > data.totalElements
  )
    throw new ApiError('목록 응답 형식을 확인할 수 없습니다.', 200);
  return data as unknown as ListPage<T>;
};
