import { ApiError } from '@admin/api/client';
import { getSettlementMismatches } from '@admin/api/settlementMismatches';
import { useApiResource } from '@admin/hooks/useApiResource';

const pendingQuery = new URLSearchParams({
  resolved: 'false',
  page: '0',
  size: '1',
}).toString();

const getPendingSettlementError = (cause: unknown) =>
  cause instanceof ApiError
    ? cause.message
    : '미해결 정산 불일치를 불러오지 못했습니다.';

/** 분석 기간과 무관한 전체 미해결 건수를 조회하며, 계정 변경 시 이전 결과를 표시하지 않는다. */
export const usePendingSettlementCount = () => {
  const resource = useApiResource(
    getSettlementMismatches,
    pendingQuery,
    getPendingSettlementError,
  );
  return {
    count: resource.data?.totalElements,
    error: resource.error,
    loading: resource.loading,
    refresh: resource.refresh,
  };
};
