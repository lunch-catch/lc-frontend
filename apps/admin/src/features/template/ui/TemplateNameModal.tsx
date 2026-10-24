import { useRef, useState } from 'react';
import { Button, Input } from '@repo/ui';

import { AdminModal } from '@admin/ui/AdminModal/AdminModal';

import { getTemplateError, getValidTemplateName } from '../templateUtils';

interface TemplateNameModalProps {
  onClose: () => void;
  onStart: (name: string) => void | Promise<void>;
  initialName?: string;
}

/** 생성 전 이름 입력과 기존 템플릿 이름 수정을 같은 검증·요청 잠금으로 처리한다. */
export const TemplateNameModal = ({
  onClose,
  onStart,
  initialName,
}: TemplateNameModalProps) => {
  const [name, setName] = useState(initialName ?? '새 템플릿');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestLock = useRef(false);
  const renaming = initialName !== undefined;
  const validName = getValidTemplateName(name);
  const close = () => {
    if (!requestLock.current) onClose();
  };
  const submit = async () => {
    if (
      !validName ||
      requestLock.current ||
      (renaming && validName === initialName)
    )
      return;
    requestLock.current = true;
    setBusy(true);
    setError(null);
    try {
      await onStart(validName);
    } catch (cause) {
      setError(getTemplateError(cause));
    } finally {
      requestLock.current = false;
      setBusy(false);
    }
  };

  return (
    <AdminModal
      open
      title={renaming ? '템플릿 이름 수정' : '새 템플릿 생성'}
      onClose={close}
    >
      <form
        className="flex flex-col gap-6"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <Input
          autoFocus
          label="템플릿명"
          maxLength={100}
          disabled={busy}
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="템플릿명을 입력해 주세요"
        />
        <p className="text-body-sm-web text-text-secondary">
          {renaming
            ? '템플릿 이름만 변경합니다. 이미 만든 포스터의 제목은 바뀌지 않습니다.'
            : '템플릿은 작성 화면에서 첫 요청을 보낼 때 생성됩니다.'}
        </p>
        {error && (
          <p role="alert" className="text-caption-web text-status-danger-fg">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            disabled={busy}
            onClick={close}
          >
            취소
          </Button>
          <Button
            type="submit"
            disabled={
              !validName || busy || (renaming && validName === initialName)
            }
            isLoading={busy}
          >
            {renaming ? '변경' : '시작하기'}
          </Button>
        </div>
      </form>
    </AdminModal>
  );
};
