import { useState } from 'react';
import { Button } from '@repo/ui';

import { suspendMockMember } from '@admin/api/mocks/members';
import { AdminModal } from '@admin/components/AdminModal/AdminModal';

import type { Member } from './memberTypes';

interface MemberSuspensionReviewProps {
  userId: string;
  member?: Member;
  statusLabel?: string;
  onShowAll: () => void;
  onSuspended: (member: Member) => void;
}

// 부정 의심 신호로 자동 정지하지 않고 회원 상태 확인과 관리자의 명시적인 결정을 거친다.
export const MemberSuspensionReview = ({
  userId,
  member,
  statusLabel,
  onShowAll,
  onSuspended,
}: MemberSuspensionReviewProps) => {
  const [open, setOpen] = useState(false);
  const [isSuspending, setIsSuspending] = useState(false);
  const [error, setError] = useState('');
  const canSuspend = member?.status === 'ACTIVE';

  const closeModal = () => {
    // 처리 중 모달을 닫아 결과를 놓치거나 중복 요청하지 않도록 유지한다.
    if (!isSuspending) setOpen(false);
  };
  const handleSuspend = async () => {
    if (!member || !canSuspend || isSuspending) return;
    setIsSuspending(true);
    setError('');
    try {
      const updatedMember = await suspendMockMember(member.id);
      // 정지 결과만 목록 부모에 전달하고 모달의 진행·오류 상태는 이 컴포넌트가 관리한다.
      onSuspended(updatedMember);
      setOpen(false);
    } catch {
      setError(
        '계정을 정지하지 못했습니다. 현재 계정 상태를 확인한 뒤 다시 시도해 주세요.',
      );
    } finally {
      setIsSuspending(false);
    }
  };

  return (
    <>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-md border border-border-subtle bg-bg-surface p-4">
        <div>
          <p className="text-body-sm-web text-text-primary">
            부정 의심 계정 검토 · {userId}
          </p>
          <p className="mt-1 text-caption-web text-text-secondary">
            {member
              ? `현재 상태: ${statusLabel}. 의심 내역을 검토한 뒤 정지를 결정해 주세요.`
              : '해당 사용자를 찾을 수 없습니다.'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="neutral" onClick={onShowAll}>
            전체 사용자 보기
          </Button>
          <Button
            variant="danger"
            disabled={!canSuspend}
            onClick={() => {
              setError('');
              setOpen(true);
            }}
          >
            계정 정지
          </Button>
        </div>
      </div>
      <AdminModal open={open} title="사용자 계정 정지" onClose={closeModal}>
        <p className="text-body-sm-web text-text-secondary">
          {userId} 계정을 정지하시겠습니까? 부정 의심 경고만으로 자동 정지하지
          않으며, 관리자의 확인 후 적용됩니다.
        </p>
        {error && (
          <p
            className="mt-3 text-caption-web text-status-danger-fg"
            role="alert"
          >
            {error}
          </p>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <Button
            variant="neutral"
            disabled={isSuspending}
            onClick={closeModal}
          >
            취소
          </Button>
          <Button
            variant="danger"
            isLoading={isSuspending}
            onClick={() => void handleSuspend()}
          >
            정지 적용
          </Button>
        </div>
      </AdminModal>
    </>
  );
};
