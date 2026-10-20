import { getPayments } from '@admin/api/payments';
import { useApiResource } from '@admin/hooks/useApiResource';

import { getPaymentError } from './paymentUtils';

// 취소·계정별 결과 구분·재조회는 공유하고 결제 전용 오류 안내를 유지한다.
export const usePayments = (query: string | null) =>
  useApiResource(getPayments, query, getPaymentError);
