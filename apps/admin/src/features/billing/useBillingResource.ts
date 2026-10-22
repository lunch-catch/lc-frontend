import { useApiResource } from '@admin/hooks/useApiResource';

import { getBillingManagementError } from './billingManagementUtils';

// 조회 흐름은 공유하고, 결제 오류 코드의 해석은 이 기능 안에 둔다.
export const useBillingResource = <T>(
  load: (query: string, signal: AbortSignal) => Promise<T>,
  query: string | null,
) => useApiResource(load, query, getBillingManagementError);
