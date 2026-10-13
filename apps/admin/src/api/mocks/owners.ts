import type { MemberStatus, Owner } from '@admin/features/member/memberTypes';

// 점주 목록 API 연동 전까지 점주 탭에서만 사용하는 목업이며 사용자 목록은 실제 API를 조회한다.
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
