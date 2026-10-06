import { useNavigate } from 'react-router';

import { FraudManagementContent } from '@admin/features/fraud/FraudManagementContent';

export const FraudManagementPage = () => {
  const navigate = useNavigate();
  return (
    <FraudManagementContent
      onManageMember={(userId) => {
        // 검토 대상을 URL에 남겨 새로고침·뒤로 가기에서도 같은 사용자를 선택한다.
        const query = new URLSearchParams({ tab: 'member', userId });
        void navigate(`/members?${query.toString()}`);
      }}
    />
  );
};
