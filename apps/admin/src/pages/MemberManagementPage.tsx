import { useSearchParams } from 'react-router';

import { MemberManagementContent } from '@admin/features/member/MemberManagementContent';

export const MemberManagementPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialMemberId = searchParams.get('userId')?.trim() || undefined;
  const initialTab =
    initialMemberId || searchParams.get('tab') === 'member'
      ? 'member'
      : 'owner';

  return (
    <MemberManagementContent
      // URL의 검토 대상·탭이 바뀌면 이전 목록의 조회 상태를 재사용하지 않는다.
      key={`${initialTab}:${initialMemberId ?? 'all'}`}
      initialMemberId={initialMemberId}
      initialTab={initialTab}
      onReviewEnd={(tab) => setSearchParams({ tab })}
    />
  );
};
