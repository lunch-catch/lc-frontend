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
  ageGroup: string;
  gender: string;
  nickname: string;
}
