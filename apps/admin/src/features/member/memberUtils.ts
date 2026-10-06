import type { Member, MemberStatus } from './memberTypes';

export const isIncludedInDateRange = (
  joinedAt: string,
  startDate: string,
  endDate: string,
) => {
  if (startDate && joinedAt < startDate) {
    return false;
  }

  return !endDate || joinedAt <= endDate;
};

export const getMaskedValue = (value: string, status: MemberStatus) =>
  status === 'WITHDRAWN' ? '***' : value;

// 삭제 대상 정보는 화면과 검색·정렬에서 같은 표시 값을 사용한다.
export const getMemberDisplayValue = (
  member: Member,
  key: 'nickname' | 'gender' | 'ageGroup' | 'address',
) => {
  if (member.status === 'WITHDRAWN') {
    return key === 'nickname' ? '탈퇴한회원' : '-';
  }

  return member[key] || '-';
};
