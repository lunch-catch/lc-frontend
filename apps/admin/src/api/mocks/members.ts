import type {
  Member,
  MemberStatus,
  Owner,
} from '@admin/features/member/memberTypes';

export const mockOwners: Owner[] = Array.from({ length: 24 }, (_, index) => {
  const number = 24 - index;
  const status: MemberStatus =
    number % 11 === 0 ? 'WITHDRAWN' : number % 7 === 0 ? 'SUSPENDED' : 'ACTIVE';

  return {
    businessNumber: `123-45-${String(67000 + number).padStart(5, '0')}`,
    id: `OWN-${String(number).padStart(4, '0')}`,
    joinedAt: `2026-09-${String(((number - 1) % 28) + 1).padStart(2, '0')}`,
    lastAccessedAt: `2026-09-${String(((number + 3) % 28) + 1).padStart(2, '0')} 10:30`,
    status,
    storeName: `${['한상차림', '오늘의 파스타', '도시락 연구소', '미소 카레'][number % 4]} ${number}`,
    storeRegistrationCompleted: number % 3 !== 0,
  };
});

export const mockMembers: Member[] = Array.from({ length: 24 }, (_, index) => {
  const number = 24 - index;
  const status: MemberStatus =
    number % 10 === 0 ? 'WITHDRAWN' : number % 6 === 0 ? 'SUSPENDED' : 'ACTIVE';

  return {
    address:
      status === 'WITHDRAWN'
        ? undefined
        : ['서울특별시 강남구', '서울특별시 서초구', '서울특별시 송파구'][
            number % 3
          ],
    ageGroup: ['20대', '30대', '40대', '50대 이상'][number % 4],
    gender: ['남', '여', '기타'][number % 3],
    id: `MEM-${String(number).padStart(4, '0')}`,
    joinedAt: `2026-09-${String(((number + 1) % 28) + 1).padStart(2, '0')}`,
    lastAccessedAt: `2026-09-${String(((number + 5) % 28) + 1).padStart(2, '0')} 12:10`,
    nickname: `${['런치러버', '점심탐험가', '쿠폰수집가', '오늘도한끼'][number % 4]}${number}`,
    status,
  };
});
