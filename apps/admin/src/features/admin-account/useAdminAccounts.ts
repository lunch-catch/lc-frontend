import { useEffect, useState } from 'react';

import { getAdminAccounts } from '@admin/api/adminAccounts';
import { ApiError } from '@admin/api/client';
import { useApiResource } from '@admin/hooks/useApiResource';

const loadAccounts = async (keyword: string, signal: AbortSignal) => {
  try {
    return { accounts: await getAdminAccounts(keyword, signal) };
  } catch (cause) {
    // 공통 조회 훅의 취소 처리를 유지하면서 권한과 재시도 대기 정보를 보존한다.
    if (signal.aborted) throw cause;
    return {
      failure: {
        message:
          cause instanceof ApiError
            ? cause.message
            : '관리자 목록에 연결하지 못했습니다. 다시 시도해 주세요.',
        forbidden: cause instanceof ApiError && cause.status === 403,
        retryAt:
          cause instanceof ApiError && cause.retryAfterSeconds
            ? Date.now() + cause.retryAfterSeconds * 1000
            : 0,
      },
    };
  }
};

export const useAdminAccounts = (keyword: string, enabled: boolean) => {
  // 이 래퍼는 권한·대기 오류도 반환값으로 전달하므로 성공 캐시에서 제외한다.
  const resource = useApiResource(
    loadAccounts,
    enabled ? keyword : null,
    undefined,
    { cache: false },
  );
  const failure = resource.data?.failure;
  const retryAt = failure?.retryAt ?? 0;
  const [readyAt, setReadyAt] = useState(0);
  // Retry-After가 지나면 수동 재시도만 허용하며 조회나 토큰 재발급을 자동 반복하지 않는다.
  useEffect(() => {
    if (!retryAt) return;
    const timer = window.setTimeout(
      () => setReadyAt(retryAt),
      Math.min(2147483647, Math.max(0, retryAt - Date.now())),
    );
    return () => window.clearTimeout(timer);
  }, [retryAt]);

  return {
    accounts: resource.data?.accounts ?? [],
    loading: resource.loading,
    error: failure?.message ?? resource.error,
    forbidden: failure?.forbidden ?? false,
    isWaiting: retryAt > 0 && readyAt !== retryAt,
    refresh: resource.refresh,
  };
};
