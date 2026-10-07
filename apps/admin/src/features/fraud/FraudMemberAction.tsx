interface FraudMemberActionProps {
  userId: string;
  onManageMember: (userId: string) => void;
}

// 목록과 상세는 상위 페이지에 사용자 ID만 전달해 회원 기능을 직접 참조하지 않는다.
export const FraudMemberAction = ({
  userId,
  onManageMember,
}: FraudMemberActionProps) => (
  <button
    aria-label={`${userId} 사용자 확인`}
    className="rounded-sm text-action-primary hover:underline focus-visible:outline-2 focus-visible:outline-action-primary"
    onClick={() => onManageMember(userId)}
    type="button"
  >
    사용자 확인
  </button>
);
