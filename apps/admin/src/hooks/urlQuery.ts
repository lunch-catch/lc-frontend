import { getKstToday } from './queryDateUtils';

export interface QueryField<T extends string | number> {
  defaultValue: T;
  parse: (value: string | null) => T;
}

export const queryText = (defaultValue = ''): QueryField<string> => ({
  defaultValue,
  parse: (value) => value ?? defaultValue,
});

export const queryChoice = <T extends string>(
  choices: readonly T[],
  defaultValue: T,
): QueryField<T> => ({
  defaultValue,
  parse: (value) =>
    choices.includes(value as T) ? (value as T) : defaultValue,
});

export const queryPage: QueryField<number> = {
  defaultValue: 1,
  parse: (value) => {
    const page = Number(value);
    return value &&
      /^\d+$/.test(value) &&
      Number.isSafeInteger(page) &&
      page > 0
      ? page
      : 1;
  },
};

export const queryPageSize = (defaultValue = 20): QueryField<number> => ({
  defaultValue,
  parse: (value) =>
    [5, 10, 20, 50].includes(Number(value)) ? Number(value) : defaultValue,
});
export const querySize = queryPageSize();

/** 여러 선택값은 허용된 값만 고정된 순서로 저장하며, 빈 선택과 기본 선택을 구분한다. */
export const queryChoices = (
  choices: readonly string[],
): QueryField<string> => ({
  defaultValue: choices.join(','),
  parse: (value) => {
    if (value === '') return '';
    const values = new Set(value?.split(','));
    const selected = choices.filter((choice) => values.has(choice));
    return selected.length ? selected.join(',') : choices.join(',');
  },
});

export const queryDate = (defaultValue = ''): QueryField<string> => ({
  defaultValue,
  parse: (value) => {
    // 키가 없으면 기본 기간, 빈 값이면 사용자가 기간을 지운 상태로 복원한다.
    if (value === '') return '';
    if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return defaultValue;
    const date = new Date(`${value}T00:00:00Z`);
    return Number.isFinite(date.getTime()) &&
      date.toISOString().slice(0, 10) === value
      ? value
      : defaultValue;
  },
});

/** URL로 직접 입력한 미래 조회일도 오늘로 제한한다. 빈 값은 미선택 상태로 유지한다. */
export const queryPastDate = (defaultValue = ''): QueryField<string> => ({
  defaultValue,
  parse: (value) => {
    const parsed = queryDate(defaultValue).parse(value);
    const today = getKstToday();
    return parsed > today ? today : parsed;
  },
});

export type QuerySchema = Record<string, QueryField<string | number>>;
export type QueryState<S extends QuerySchema> = {
  [K in keyof S]: S[K]['defaultValue'];
};

/** URL 값을 검증해 잘못된 페이지·열 이름·날짜가 API로 전달되지 않도록 한다. */
export const readQueryState = <S extends QuerySchema>(
  params: URLSearchParams,
  prefix: string,
  schema: S,
): QueryState<S> =>
  Object.fromEntries(
    Object.entries(schema).map(([key, field]) => [
      key,
      field.parse(params.get(`${prefix}${key}`)),
    ]),
  ) as QueryState<S>;

/** 다른 탭의 조건을 보존하고 기본값은 생략해 공유 URL을 간결하게 유지한다. */
export const writeQueryState = <S extends QuerySchema>(
  params: URLSearchParams,
  prefix: string,
  schema: S,
  patch: Partial<QueryState<S>>,
) => {
  const next = new URLSearchParams(params);
  for (const key of Object.keys(patch)) {
    const value = patch[key];
    if (value === undefined) continue;
    if (value === schema[key].defaultValue) next.delete(`${prefix}${key}`);
    else next.set(`${prefix}${key}`, String(value));
  }
  return next;
};
