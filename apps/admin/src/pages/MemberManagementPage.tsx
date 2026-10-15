import { useSearchParams } from 'react-router';

import { MemberManagementContent } from '@admin/features/member/MemberManagementContent';

export const MemberManagementPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialMemberId = searchParams.get('userId')?.trim() || undefined;
  const activeTab =
    initialMemberId || searchParams.get('tab') === 'member'
      ? 'member'
      : 'owner';

  return (
    <MemberManagementContent
      // 검토 대상이 바뀔 때만 상태를 초기화한다. 일반 탭 이동은 URL의 탭 값으로 제어한다.
      key={initialMemberId ?? 'all'}
      initialMemberId={initialMemberId}
      activeTab={activeTab}
      onReviewEnd={(tab) =>
        setSearchParams((current) => {
          const next = new URLSearchParams(current);
          next.delete('userId');
          if (tab === 'owner') next.delete('tab');
          else next.set('tab', tab);
          return next;
        })
      }
    />
  );
};
