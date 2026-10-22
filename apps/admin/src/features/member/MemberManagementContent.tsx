import { Activity } from 'react';
import { Tabs } from '@repo/ui';

import type { MemberType } from './memberTypes';
import { OwnerMemberListContent } from './OwnerMemberListContent';
import { UserMemberListContent } from './UserMemberListContent';

interface MemberManagementContentProps {
  initialMemberId?: string;
  activeTab?: MemberType;
  onReviewEnd?: (tab: MemberType) => void;
}
export const MemberManagementContent = ({
  initialMemberId,
  activeTab = 'owner',
  onReviewEnd,
}: MemberManagementContentProps) => (
  <section className="flex flex-col">
    <header className="mb-4">
      <h2 className="text-display-web font-semibold text-text-primary">
        회원 관리
      </h2>
      <p className="mt-2 text-body-sm-web text-text-secondary">
        점주와 사용자의 계정 상태 및 가입 정보를 조회할 수 있습니다.
      </p>
    </header>
    <Tabs
      items={[
        { label: '점주 목록', value: 'owner' },
        { label: '사용자 목록', value: 'member' },
      ]}
      value={activeTab}
      onValueChange={(value) => {
        if ((value === 'owner' || value === 'member') && value !== activeTab)
          onReviewEnd?.(value);
      }}
    />
    {/* 조회 결과·열 너비를 보존하고 숨긴 탭의 조회 효과는 중단한다. */}
    <Activity mode={activeTab === 'owner' ? 'visible' : 'hidden'}>
      <OwnerMemberListContent />
    </Activity>
    <Activity mode={activeTab === 'member' ? 'visible' : 'hidden'}>
      <UserMemberListContent
        initialMemberId={initialMemberId}
        onReviewEnd={() => onReviewEnd?.('member')}
      />
    </Activity>
  </section>
);
