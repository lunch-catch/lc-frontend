import { useEffect, useState } from 'react';

import { type CampaignPage, getCampaigns } from '@admin/api/campaigns';
import { useAdminAuth } from '@admin/auth/useAdminAuth';

import { getCampaignError } from './campaignUtils';

interface CampaignResult {
  filterKey: string;
  requestKey: string;
  data?: CampaignPage;
  error?: string;
}

/** 서버 커서로 목록을 누적하며 조건·계정이 바뀌면 이전 커서를 재사용하지 않는다. */
export const useCampaigns = (query: string | null) => {
  const { admin } = useAdminAuth();
  const enabled = admin !== null && query !== null;
  const filterKey = JSON.stringify([admin?.adminId, query]);
  const [cursor, setCursor] = useState({
    filterKey,
    pageToken: null as string | null,
    revision: 0,
  });
  const [result, setResult] = useState<CampaignResult | null>(null);
  if (cursor.filterKey !== filterKey) {
    setCursor({ filterKey, pageToken: null, revision: 0 });
  }
  const params = new URLSearchParams(query ?? '');
  if (cursor.pageToken) params.set('pageToken', cursor.pageToken);
  const queryString = params.toString();
  const requestKey = JSON.stringify([
    filterKey,
    cursor.pageToken,
    cursor.revision,
  ]);
  const pageToken = cursor.pageToken;

  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    void getCampaigns(queryString, controller.signal).then(
      (data) => {
        if (controller.signal.aborted) return;
        setResult((previous) => {
          const items =
            pageToken && previous?.filterKey === filterKey
              ? (previous.data?.items ?? [])
              : [];
          // 추가 조회·재시도 중 같은 캠페인이 반환돼도 한 행만 표시한다.
          const unique = new Map(
            [...items, ...data.items].map((item) => [item.campaignId, item]),
          );
          return {
            filterKey,
            requestKey,
            data: { ...data, items: [...unique.values()] },
          };
        });
      },
      (cause: unknown) => {
        if (!controller.signal.aborted)
          setResult((previous) => ({
            filterKey,
            requestKey,
            error: getCampaignError(cause),
            // 추가 페이지 실패 시 기존 행과 다음 커서를 유지해 같은 요청을 재시도한다.
            data: previous?.filterKey === filterKey ? previous.data : undefined,
          }));
      },
    );
    return () => controller.abort();
  }, [enabled, filterKey, requestKey, pageToken, queryString]);

  const current = enabled && result?.filterKey === filterKey ? result : null;
  const loading = enabled && current?.requestKey !== requestKey;
  return {
    data: current?.data,
    error: current?.requestKey === requestKey ? current.error : undefined,
    loading,
    refresh: () =>
      setCursor((previous) => ({
        filterKey,
        pageToken: null,
        revision: previous.revision + 1,
      })),
    loadMore: () => {
      const token = current?.data?.nextPageToken;
      if (loading || !token) return;
      setCursor((previous) => ({
        filterKey,
        pageToken: token,
        revision: previous.revision + 1,
      }));
    },
  };
};
