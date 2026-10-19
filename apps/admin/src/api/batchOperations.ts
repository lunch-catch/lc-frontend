import { ApiError, requestData } from './client';
import { isId, isRecord } from './listResponse';

export interface BatchRetryReceipt {
  runId: number;
  jobName: string;
  businessDate: string;
  status: 'RUNNING';
}
export const retryBatchExecution = async (
  jobName: string,
  businessDate: string,
): Promise<BatchRetryReceipt> => {
  const data = await requestData<unknown>(
    '/v1/admin/batch-executions/' +
      encodeURIComponent(jobName) +
      '/' +
      encodeURIComponent(businessDate) +
      ':retry',
    { method: 'POST' },
    202,
  );
  if (
    !isRecord(data) ||
    !isId(data.runId) ||
    data.jobName !== jobName ||
    data.businessDate !== businessDate ||
    data.status !== 'RUNNING'
  )
    throw new ApiError('배치 재실행 접수 응답을 확인할 수 없습니다.', 202);
  return data as unknown as BatchRetryReceipt;
};
