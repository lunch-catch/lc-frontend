import { useEffect, useState } from 'react';

import { ApiError } from '@admin/api/client';
import {
  getPointLedger,
  type PointLedgerPage,
  type PointLedgerType,
} from '@admin/api/pointLedger';

export interface PointLedgerFilters {
  ownerId: string;
  campaignId: string;
  type: PointLedgerType | 'ALL';
  from: string;
  to: string;
}

interface PointLedgerResult {
  filterKey: string;
  key: string;
  data?: PointLedgerPage;
  error?: string;
}

export const usePointLedger = (
  pageSize: number,
  filters: PointLedgerFilters | null,
  sortDir: 'asc' | 'desc' = 'desc',
) => {
  const [pageToken, setPageToken] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const filterKey = JSON.stringify([pageSize, filters, sortDir]);
  const [previousFilterKey, setPreviousFilterKey] = useState(filterKey);
  const [result, setResult] = useState<PointLedgerResult | null>(null);
  // 조건이 바뀌면 누적 목록과 커서를 함께 비워 서로 다른 검색 결과가 섞이지 않게 한다.
  // 렌더링 중 조건부로 초기화해 요청 effect에 이전 조건의 커서가 전달되지 않도록 한다.
  if (previousFilterKey !== filterKey) {
    setPreviousFilterKey(filterKey);
    setPageToken(null);
    setResult(null);
  }
  const query = new URLSearchParams({ pageSize: String(pageSize), sortDir });
  if (filters) {
    query.set('ownerId', filters.ownerId);
    query.set('from', filters.from);
    query.set('to', filters.to);
    if (filters.type !== 'ALL') query.set('type', filters.type);
    if (filters.campaignId) query.set('campaignId', filters.campaignId);
  }
  if (pageToken) query.set('pageToken', pageToken);
  const queryString = query.toString();
  // filterKey는 누적 목록의 조건, requestKey는 실패한 추가 조회의 재시도까지 구분한다.
  const requestKey = `${queryString}:${revision}`;
  const enabled = filters !== null;

  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    void getPointLedger(queryString, controller.signal).then(
      (data) => {
        if (controller.signal.aborted) return;
        setResult((current) => {
          const previousItems =
            pageToken && current?.filterKey === filterKey
              ? (current.data?.items ?? [])
              : [];
          // 재시도나 조회 중 데이터 변동으로 같은 원장이 반환돼도 중복 행을 만들지 않는다.
          const items = new Map(
            [...previousItems, ...data.items].map((item) => [
              item.ledgerId,
              item,
            ]),
          );
          return {
            filterKey,
            key: requestKey,
            data: { ...data, items: [...items.values()] },
          };
        });
      },
      (error: unknown) => {
        if (!controller.signal.aborted)
          setResult((current) => ({
            filterKey,
            key: requestKey,
            // 추가 조회 실패 시 이미 불러온 행은 유지하고 같은 커서로 다시 요청할 수 있게 한다.
            data: current?.filterKey === filterKey ? current.data : undefined,
            error:
              error instanceof ApiError
                ? error.message
                : '서버에 연결하지 못했습니다.',
          }));
      },
    );
    // 이전 조건의 늦은 응답이 현재 화면을 덮지 않도록 조회 취소와 요청 키를 함께 사용한다.
    return () => controller.abort();
  }, [enabled, filterKey, pageToken, queryString, requestKey]);

  // 추가 요청 중에는 같은 조건의 기존 목록을 계속 표시하고 로딩 여부만 요청 키로 판단한다.
  const currentResult = result?.filterKey === filterKey ? result : null;
  const loading = enabled && currentResult?.key !== requestKey;
  const loadMore = () => {
    const token = currentResult?.data?.nextPageToken;
    if (loading || !token) return;
    setPageToken(token);
    // 실패한 커서와 같아도 더보기를 누르면 새 요청을 실행한다.
    setRevision((value) => value + 1);
  };
  return {
    data: currentResult?.data,
    error: currentResult?.key === requestKey ? currentResult.error : undefined,
    loading,
    enabled,
    sortDir,
    loadMore,
    hasNext: Boolean(currentResult?.data?.nextPageToken),
  };
};
