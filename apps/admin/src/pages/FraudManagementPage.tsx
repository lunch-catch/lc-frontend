import { FraudManagementContent } from '@admin/features/fraud/FraudManagementContent';

interface FraudManagementPageProps {
  onManageMember: (userId: string) => void;
}

export const FraudManagementPage = ({
  onManageMember,
}: FraudManagementPageProps) => (
  // 화면 이동은 앱에서 주입해 부정·회원 feature 사이의 의존을 막는다.
  <FraudManagementContent onManageMember={onManageMember} />
);
