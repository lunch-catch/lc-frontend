import { useRef, useState } from 'react';

import {
  issueAdminAccount,
  type IssuedAdminAccount,
} from '@admin/api/adminAccounts';
import { ApiError } from '@admin/api/client';
import { useRequestFeedback } from '@admin/hooks/useRequestFeedback';

import type {
  AdminAccountForm,
  AdminAccountFormErrors,
} from './adminAccountTypes';
import { validateAdminAccount } from './adminAccountValidation';

const emptyForm: AdminAccountForm = {
  id: '',
  name: '',
  password: '',
  passwordConfirmation: '',
  role: 'ADMIN',
};

// 폼 검증·중복 전송 차단·재시도 대기는 발급 흐름 안에서 함께 관리한다.
export const useIssueAdminAccount = (
  canIssueAccount: boolean,
  onIssued: (account: IssuedAdminAccount) => void,
) => {
  const [form, setForm] = useState<AdminAccountForm>(emptyForm);
  const [formErrors, setFormErrors] = useState<AdminAccountFormErrors>({});
  const [isIssuing, setIsIssuing] = useState(false);
  const issuingRef = useRef(false);
  const [notice, setNotice] = useState('');
  const {
    errorMessage,
    isWaiting,
    retryAfterSeconds,
    reportError,
    clearError,
  } = useRequestFeedback();
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const closeIssueModal = () => {
    if (issuingRef.current) return;
    setForm(emptyForm);
    setFormErrors({});
    clearError();
    setIsIssueModalOpen(false);
  };

  const handleIssue = async () => {
    // 버튼 표시 외에도 처리 시점의 권한을 확인한다. 서버에서도 검증이 필요하다.
    if (!canIssueAccount || issuingRef.current || isWaiting) return;
    const nextErrors = validateAdminAccount(form);
    setFormErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    issuingRef.current = true;
    setIsIssuing(true);
    clearError();
    setNotice('');
    try {
      // 비밀번호 확인은 화면에서만 검증하고 API 계약의 필드만 전달한다.
      const issued = await issueAdminAccount({
        loginId: form.id,
        initialPassword: form.password,
        name: form.name.trim(),
        role: form.role,
      });
      onIssued(issued);
      setForm(emptyForm);
      setFormErrors({});
      setIsIssueModalOpen(false);
      setNotice('관리자 계정이 발급되었습니다.');
    } catch (error) {
      if (
        error instanceof ApiError &&
        error.status === 409 &&
        error.code === 'ADMIN-001'
      )
        setFormErrors({ id: error.message });
      reportError(error);
    } finally {
      issuingRef.current = false;
      setIsIssuing(false);
    }
  };

  return {
    form,
    formErrors,
    setForm,
    setFormErrors,
    isIssuing,
    isWaiting,
    retryAfterSeconds,
    errorMessage,
    notice,
    isIssueModalOpen,
    openIssueModal: () => setIsIssueModalOpen(true),
    closeIssueModal,
    handleIssue,
  };
};
