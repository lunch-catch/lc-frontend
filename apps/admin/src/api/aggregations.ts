import { ApiError, request, requestData } from './client';
import { isCount, isId, isNullableText, isRecord } from './listResponse';

export interface AggregationRun {
  runId: number;
  jobName: 'DAILY_AGGREGATION';
  businessDate: string;
  status: 'RUNNING' | 'SUCCESS' | 'FAILED';
  startedAt: string | null;
  finishedAt: string | null;
  processedCount: number | null;
  executedBy: string | null;
  retryCount: number;
  failureReason: string | null;
}
export interface RecalculationReceipt {
  runId: number;
  businessDate: string;
  status: 'RUNNING';
}
const isTimestamp = (value: unknown) =>
  value === null ||
  (typeof value === 'string' && Number.isFinite(Date.parse(value)));

export const getAggregationRun = async (
  query: string,
  signal: AbortSignal,
): Promise<AggregationRun | null> => {
  const response = await request('/v1/admin/aggregation-runs?' + query, {
    signal,
  });
  const body: unknown = await response.json().catch(() => null);
  if (
    response.status !== 200 ||
    !isRecord(body) ||
    body.code !== 'SUCCESS' ||
    !('data' in body)
  )
    throw new ApiError('집계 실행 응답을 확인할 수 없습니다.', response.status);
  // 실행 기록이 없는 null 응답도 정상이다. null을 거부하는 requestData와 구분한다.
  if (body.data === null) return null;
  const data = body.data;
  if (
    !isRecord(data) ||
    !isId(data.runId) ||
    data.jobName !== 'DAILY_AGGREGATION' ||
    data.businessDate !== new URLSearchParams(query).get('businessDate') ||
    !['RUNNING', 'SUCCESS', 'FAILED'].includes(String(data.status)) ||
    !isTimestamp(data.startedAt) ||
    !isTimestamp(data.finishedAt) ||
    !(data.processedCount === null || isCount(data.processedCount)) ||
    !isNullableText(data.executedBy) ||
    !isCount(data.retryCount) ||
    !isNullableText(data.failureReason)
  )
    throw new ApiError('집계 실행 응답 형식을 확인할 수 없습니다.', 200);
  return data as unknown as AggregationRun;
};
export const recalculateAggregation = async (
  businessDate: string,
): Promise<RecalculationReceipt> => {
  const data = await requestData<unknown>(
    '/v1/admin/aggregations:recalculate',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ businessDate }),
    },
    202,
  );
  if (
    !isRecord(data) ||
    !isId(data.runId) ||
    data.businessDate !== businessDate ||
    data.status !== 'RUNNING'
  )
    throw new ApiError('재집계 접수 응답을 확인할 수 없습니다.', 202);
  return data as unknown as RecalculationReceipt;
};
