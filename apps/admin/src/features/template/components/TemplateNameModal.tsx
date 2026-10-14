import { useState } from 'react';
import { Button, Input } from '@repo/ui';

import { AdminModal } from '@admin/components/AdminModal/AdminModal';
import { getValidTemplateName } from '@admin/features/template/templateUtils';

interface TemplateNameModalProps {
  onClose: () => void;
  onStart: (name: string) => void;
}

export const TemplateNameModal = ({
  onClose,
  onStart,
}: TemplateNameModalProps) => {
  const [name, setName] = useState('새 템플릿');
  const validName = getValidTemplateName(name);

  return (
    <AdminModal open title="새 템플릿 생성" onClose={onClose}>
      <form
        className="flex flex-col gap-6"
        onSubmit={(event) => {
          event.preventDefault();
          if (validName) onStart(validName);
        }}
      >
        <Input
          autoFocus
          label="템플릿명"
          maxLength={100}
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="템플릿명을 입력해 주세요"
        />
        <p className="text-body-sm-web text-text-secondary">
          생성 후에는 이름을 변경할 수 없습니다. 템플릿은 작성 화면에서 첫
          요청을 보낼 때 생성됩니다.
        </p>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            취소
          </Button>
          <Button type="submit" disabled={!validName}>
            시작하기
          </Button>
        </div>
      </form>
    </AdminModal>
  );
};
