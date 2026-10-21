import { useEffect, useState } from 'react';

import {
  type CampaignReport,
  getCampaignReports,
} from '@admin/api/campaignReports';
import { ApiError } from '@admin/api/client';
import { useAdminAuth } from '@admin/auth/useAdminAuth';

interface ReportResult {
  key: string;
  reports: CampaignReport[];
  failure?: { query: string; revision: number; message: string };
}

export const useCampaignReports = (
  campaignIds: readonly number[],
  scope = '',
) => {
  const { admin } = useAdminAuth();
  // 계정이나 목록 조건이 바뀌면 이전 조회의 캐시를 현재 실적으로 사용하지 않는다.
  const key = admin ? JSON.stringify([admin.adminId, scope]) : null;
  const [result, setResult] = useState<ReportResult | null>(null);
  const [revision, setRevision] = useState(0);
  const current = key !== null && result?.key === key ? result : null;
  const reports = new Map(
    current?.reports.map((report) => [report.campaignId, report]),
  );
  // 이미 받은 행은 다시 요청하지 않고, 추가로 불러온 캠페인의 실적만 조회한다.
  const query = [...new Set(campaignIds)]
    .filter((id) => !reports.has(id))
    .sort((a, b) => a - b)
    .join(',');

  useEffect(() => {
    if (key === null || !query) return;
    const controller = new AbortController();
    void getCampaignReports(
      query.split(',').map(Number),
      controller.signal,
    ).then(
      (items) => {
        if (controller.signal.aborted) return;
        // 추가 목록의 실적을 기다리는 동안 기존 행의 수치는 유지한다.
        setResult((previous) => ({
          key,
          reports: [
            ...(previous?.key === key ? previous.reports : []),
            ...items,
          ],
        }));
      },
      (cause: unknown) => {
        if (controller.signal.aborted) return;
        setResult((previous) => ({
          key,
          reports: previous?.key === key ? previous.reports : [],
          failure: {
            query,
            revision,
            message:
              cause instanceof ApiError
                ? cause.message
                : '캠페인 실적을 불러오지 못했습니다.',
          },
        }));
      },
    );
    return () => controller.abort();
  }, [key, query, revision]);

  const failure = current?.failure;
  const error =
    failure?.query === query && failure.revision === revision
      ? failure.message
      : undefined;
  return {
    reports,
    error,
    refresh: () => setRevision((value) => value + 1),
  };
};
