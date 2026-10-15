import { useSearchParams } from 'react-router';

import {
  type QuerySchema,
  type QueryState,
  readQueryState,
  writeQueryState,
} from './urlQuery';

/** 확정된 조건은 URL에서만 읽어 뒤로 가기에서도 입력값과 API 조건을 함께 복원한다. */
export const useUrlFilters = <S extends QuerySchema>(
  prefix: string,
  schema: S,
) => {
  const [params, setParams] = useSearchParams();
  // 한 주소의 여러 탭·테이블이 서로의 조건을 덮지 않도록 접두사로 구분한다.
  const filters = readQueryState(params, prefix, schema);
  const updateFilters = (patch: Partial<QueryState<S>>, replace = false) => {
    const next = writeQueryState(params, prefix, schema, patch);
    if (next.toString() !== params.toString()) {
      setParams(next, { replace, preventScrollReset: true });
    }
  };
  return { filters, updateFilters };
};
