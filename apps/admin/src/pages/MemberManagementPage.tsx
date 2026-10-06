import { MemberManagementContent } from '@admin/features/member/MemberManagementContent';

interface MemberManagementPageProps {
  initialMemberId?: string;
}

export const MemberManagementPage = ({
  initialMemberId,
}: MemberManagementPageProps) => (
  // 검토 대상이 바뀌거나 일반 메뉴로 돌아오면 이전 사용자 탭·검색 조건을 재사용하지 않는다.
  <MemberManagementContent
    key={initialMemberId ?? 'all'}
    initialMemberId={initialMemberId}
  />
);
