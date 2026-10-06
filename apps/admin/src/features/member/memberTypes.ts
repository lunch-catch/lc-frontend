export type MemberStatus = 'ACTIVE' | 'SUSPENDED' | 'WITHDRAWN';
export type MemberType = 'member' | 'owner';

interface BaseMember {
  id: string;
  joinedAt: string;
  lastAccessedAt: string;
  status: MemberStatus;
}

export interface Owner extends BaseMember {
  businessNumber: string;
  storeName: string;
  storeRegistrationCompleted: boolean;
}

export interface Member extends BaseMember {
  address?: string;
  ageGroup: string;
  gender: string;
  nickname: string;
}
