import { Button, Input, Radio } from '@repo/ui';

import { AdminModal } from '@admin/ui/AdminModal/AdminModal';

import { adminAccountRoleOptions } from './adminAccountOptions';
import { validateAdminAccount } from './adminAccountValidation';
import type { useIssueAdminAccount } from './useIssueAdminAccount';

interface AdminAccountIssueModalProps {
  canIssueAccount: boolean;
  issue: ReturnType<typeof useIssueAdminAccount>;
}

export const AdminAccountIssueModal = ({
  canIssueAccount,
  issue,
}: AdminAccountIssueModalProps) => {
  const {
    form,
    formErrors,
    setForm,
    setFormErrors,
    isIssuing,
    isWaiting,
    retryAfterSeconds,
    errorMessage,
    isIssueModalOpen,
    closeIssueModal,
    handleIssue,
  } = issue;

  return (
    <AdminModal
      onClose={closeIssueModal}
      open={isIssueModalOpen && canIssueAccount}
      title="관리자 계정 발급"
    >
      <fieldset disabled={isIssuing} className="flex flex-col gap-5">
        <Input
          errorMessage={formErrors.id}
          label="관리자 ID"
          onChange={(event) => {
            setForm((currentForm) => ({
              ...currentForm,
              id: event.target.value,
            }));
            setFormErrors((currentErrors) => ({
              ...currentErrors,
              id: undefined,
            }));
          }}
          placeholder="예: ADM-005"
          value={form.id}
        />
        <Input
          errorMessage={formErrors.name}
          label="이름"
          onChange={(event) => {
            setForm((currentForm) => ({
              ...currentForm,
              name: event.target.value,
            }));
            setFormErrors((currentErrors) => ({
              ...currentErrors,
              name: undefined,
            }));
          }}
          value={form.name}
        />
        <Input
          autoComplete="new-password"
          errorMessage={formErrors.password}
          label="비밀번호"
          onBlur={() => {
            // 확인란을 아직 입력하지 않았다면 원본 비밀번호에서 이동할 때 불일치 오류를 표시하지 않는다.
            if (!form.passwordConfirmation) return;
            setFormErrors((currentErrors) => ({
              ...currentErrors,
              passwordConfirmation:
                validateAdminAccount(form).passwordConfirmation,
            }));
          }}
          onChange={(event) => {
            setForm((currentForm) => ({
              ...currentForm,
              password: event.target.value,
            }));
            setFormErrors((currentErrors) => ({
              ...currentErrors,
              password: undefined,
              // 원본 비밀번호가 바뀌면 기존 불일치 결과도 숨기고 blur 또는 제출에서 다시 검사한다.
              passwordConfirmation: undefined,
            }));
          }}
          type="password"
          value={form.password}
        />
        <Input
          autoComplete="new-password"
          errorMessage={formErrors.passwordConfirmation}
          label="비밀번호 확인"
          onBlur={() => {
            // 입력 중에는 숨긴 확인 오류를 입력란에서 벗어날 때 현재 두 비밀번호로 다시 판단한다.
            setFormErrors((currentErrors) => ({
              ...currentErrors,
              passwordConfirmation:
                validateAdminAccount(form).passwordConfirmation,
            }));
          }}
          onChange={(event) => {
            setForm((currentForm) => ({
              ...currentForm,
              passwordConfirmation: event.target.value,
            }));
            setFormErrors((currentErrors) => ({
              ...currentErrors,
              passwordConfirmation: undefined,
            }));
          }}
          type="password"
          value={form.passwordConfirmation}
        />
        <div className="flex flex-col">
          <span className="mb-3 text-caption-web font-medium text-text-primary">
            권한
          </span>
          <div
            aria-label="권한"
            className="flex items-center gap-4"
            role="radiogroup"
          >
            {adminAccountRoleOptions.map((option) => (
              <Radio
                checked={form.role === option.value}
                key={option.value}
                label={option.label}
                name="admin-account-role"
                onChange={() =>
                  setForm((currentForm) => ({
                    ...currentForm,
                    role: option.value,
                  }))
                }
                value={option.value}
              />
            ))}
          </div>
        </div>
        <div className="mt-1 flex justify-end gap-2">
          <Button onClick={closeIssueModal} variant="neutral">
            취소
          </Button>
          <Button
            onClick={handleIssue}
            isLoading={isIssuing}
            disabled={isWaiting}
          >
            {isWaiting ? `${retryAfterSeconds}초 후 발급` : '발급'}
          </Button>
        </div>
        {errorMessage && (
          <p role="alert" className="text-caption-web text-status-danger-fg">
            {errorMessage}
          </p>
        )}
      </fieldset>
    </AdminModal>
  );
};
