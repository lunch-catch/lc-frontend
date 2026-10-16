import {
  billingJson,
  isBillingId,
  isBillingRecord,
  isBillingText,
  isOptionalBillingId,
  readBillingPage,
} from './billingResponse';
import { ApiError, requestData } from './client';

export interface PointPolicy {
  minChargeAmount: number;
  chargeProducts: number[];
  effectiveDate: string;
  changeReason: string | null;
  createdBy: number | null;
}
export interface PointPolicies {
  current: PointPolicy;
  next: PointPolicy | null;
}
export interface PointPolicyValues {
  minChargeAmount: number;
  chargeProducts: number[];
  reason: string;
}
const isPolicy = (value: unknown): value is PointPolicy =>
  isBillingRecord(value) &&
  isBillingId(value.minChargeAmount) &&
  Array.isArray(value.chargeProducts) &&
  value.chargeProducts.length > 0 &&
  value.chargeProducts.every(
    (amount) => isBillingId(amount) && amount >= Number(value.minChargeAmount),
  ) &&
  typeof value.effectiveDate === 'string' &&
  isBillingText(value.changeReason) &&
  isOptionalBillingId(value.createdBy);

export const getPointPolicies = async (
  _query: string,
  signal: AbortSignal,
): Promise<PointPolicies> => {
  const data = await requestData<unknown>(
    '/v1/admin/point-policy',
    { signal },
    200,
  );
  if (
    !isBillingRecord(data) ||
    !isPolicy(data.current) ||
    !(data.next === null || isPolicy(data.next))
  )
    throw new ApiError('충전 정책 응답 형식을 확인할 수 없습니다.', 200);
  return data as unknown as PointPolicies;
};
export const getPointPolicyHistory = async (
  query: string,
  signal: AbortSignal,
) =>
  readBillingPage(
    await requestData<unknown>(
      `/v1/admin/point-policy/history?${query}`,
      { signal },
      200,
    ),
    isPolicy,
  );

/** 적용일은 서버가 내일로 정하며 같은 날의 저장은 내일 적용분을 덮어쓴다. */
export const savePointPolicy = async (
  values: PointPolicyValues,
): Promise<PointPolicy> => {
  const data = await requestData<unknown>(
    '/v1/admin/point-policy/next',
    billingJson('PUT', values),
    200,
  );
  if (!isPolicy(data))
    throw new ApiError('정책 저장 응답 형식을 확인할 수 없습니다.', 200);
  return data;
};
