import type { InvalidReason } from '@admin/api/fraud';

export const invalidReasonLabels: Record<InvalidReason, string> = {
  EXPIRED_OR_UNKNOWN: '만료·알 수 없는 노출',
  NOT_OWNER: '다른 회원의 노출',
};
export const invalidReasonDescriptions: Record<InvalidReason, string> = {
  EXPIRED_OR_UNKNOWN:
    '광고를 제공한 기록을 확인할 수 없는 경우입니다. 광고를 받은 뒤 30분이 지나 표시를 요청하거나, 광고 식별자가 잘못됐거나, 서버 기록에 장애가 있을 때 발생합니다.',
  NOT_OWNER:
    '광고를 받은 회원과 표시를 요청한 회원이 다른 경우입니다. 예를 들어 A에게 제공한 광고의 식별자로 B가 표시를 요청하면 발생합니다.',
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
