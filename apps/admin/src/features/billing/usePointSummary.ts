import { ApiError } from '@admin/api/client';
import {
  getPointSummary,
  type PointSummaryPeriod,
} from '@admin/api/pointSummary';
import { useApiResource } from '@admin/hooks/useApiResource';

interface PointSummaryFilters {
  ownerId: string;
  period: PointSummaryPeriod;
  from: string;
  to: string;
}

const getSummaryError = (cause: unknown) =>
  cause instanceof ApiError ? cause.message : '서버에 연결하지 못했습니다.';

export const usePointSummary = (
  filters: PointSummaryFilters | null,
  sortDir: 'asc' | 'desc' = 'desc',
) => {
  const query = filters
    ? new URLSearchParams({ ...filters, sortDir }).toString()
    : null;
  // 첫 조회·취소·재시도와 계정/조건별 결과 구분은 일반 목록과 같은 훅에 맡긴다.
  const resource = useApiResource(getPointSummary, query, getSummaryError);
  return {
    ...resource,
    sortDir,
    retry: resource.refresh,
  };
};
