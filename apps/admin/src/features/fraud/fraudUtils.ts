import type { InvalidReason } from '@admin/api/fraud';

export const invalidReasonLabels: Record<InvalidReason, string> = {
  EXPIRED_OR_UNKNOWN: '만료·알 수 없는 노출',
  NOT_OWNER: '다른 회원의 노출',
};
export const getFraudRangeError = (from: string, to: string) => {
  if (!from || !to)
    return '조회 기간을 선택해 주세요. 최대 31일까지 조회할 수 있습니다.';
  if (from > to) return '시작일은 종료일보다 늦을 수 없습니다.';
  return (Date.parse(to) - Date.parse(from)) / 86_400_000 >= 31
    ? '부정 관리 조회는 최대 31일까지 가능합니다.'
    : '';
};
export const formatFraudRatio = (value: number | null) =>
  value === null ? '—' : (value * 100).toFixed(1) + '%';
