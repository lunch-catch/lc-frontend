import {
  billingJson,
  isBillingId,
  isBillingInteger,
  isBillingRecord,
  isOptionalBillingId,
} from './billingResponse';
import { ApiError, requestData } from './client';

export interface PointAdjustmentValues {
  requestId: string;
  ownerId: number;
  amount: number;
  reason: string;
  campaignId?: number;
  mismatchId?: number;
}
export interface PointAdjustment {
  ledgerId: number;
  ownerId: number;
  amount: number;
  campaignId: number | null;
  reason: string;
  createdAt: string;
}
/** 같은 내용의 재시도에는 동일한 requestId를 사용한다. 신규 생성은 201, 재시도 성공은 200이다. */
export const adjustPoints = async (
  values: PointAdjustmentValues,
): Promise<PointAdjustment> => {
  const data = await requestData<unknown>(
    '/v1/admin/point-adjustments',
    billingJson('POST', values),
    [200, 201],
  );
  if (
    !isBillingRecord(data) ||
    !isBillingId(data.ledgerId) ||
    data.ownerId !== values.ownerId ||
    !isBillingInteger(data.amount) ||
    data.amount !== values.amount ||
    !isOptionalBillingId(data.campaignId) ||
    typeof data.reason !== 'string' ||
    typeof data.createdAt !== 'string'
  )
    throw new ApiError('포인트 조정 응답 형식을 확인할 수 없습니다.', 200);
  return data as unknown as PointAdjustment;
};
