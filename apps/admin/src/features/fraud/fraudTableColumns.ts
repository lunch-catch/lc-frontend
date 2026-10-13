import type { FraudSortKey } from './fraudTypes';

interface FraudTableHeader {
  label: string;
  key?: FraudSortKey;
  minWidth: number;
  width: string;
}

// 헤더와 열 너비를 같은 정의에서 생성해 탭별 로딩·빈 상태의 열 개수도 일치시킨다.
export const impressionHeaders: FraudTableHeader[] = [
  { label: '캠페인 ID', key: 'campaignId', minWidth: 130, width: '14%' },
  { label: '사용자 ID', key: 'userId', minWidth: 130, width: '14%' },
  { label: '무효 사유 코드', key: 'reasonCode', minWidth: 220, width: '24%' },
  { label: '건수', key: 'count', minWidth: 80, width: '9%' },
  { label: '캠페인 무효 비율', minWidth: 135, width: '14%' },
  { label: '경고', minWidth: 170, width: '15%' },
  { label: '계정 관리', minWidth: 120, width: '10%' },
];

export const requestHeaders: FraudTableHeader[] = [
  { label: '사용자 ID', key: 'userId', minWidth: 180, width: '40%' },
  { label: '요청 제한 초과 건수', key: 'count', minWidth: 180, width: '40%' },
  { label: '계정 관리', minWidth: 120, width: '20%' },
];
