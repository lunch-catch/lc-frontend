import { Navigate, useNavigate, useParams } from 'react-router';

import { TemplateCreateContent } from '@admin/features/template/components/TemplateCreateContent';
import type { PosterTemplate } from '@admin/features/template/templateTypes';
import { useTemplateManagement } from '@admin/features/template/useTemplateManagement';

export const TemplateCreatePage = () => {
  const navigate = useNavigate();
  const { templateId } = useParams();
  const { templates, saveTemplate, saveTemporaryTemplate } =
    useTemplateManagement();
  const draftTemplate = templateId
    ? (templates.find(
        (template) => template.id === templateId && template.status === 'DRAFT',
      ) ?? null)
    : null;
  // 임시저장은 메모리 목업이므로 새로고침 후 사라진 초안 주소는 목록으로 돌아간다.
  if (templateId && !draftTemplate) return <Navigate replace to="/templates" />;

  const saveAndReturn = (
    template: PosterTemplate,
    save: (template: PosterTemplate) => boolean,
  ) => {
    const saved = save(template);
    // 저장 실패 시 작성 화면을 유지해 기존 오류 처리와 재시도를 보존한다.
    if (saved) void navigate('/templates', { replace: true });
    return saved;
  };

  return (
    <TemplateCreateContent
      key={templateId ?? 'new'}
      draftTemplate={draftTemplate}
      onBack={() => void navigate('/templates')}
      onSave={(template) => saveAndReturn(template, saveTemplate)}
      onTemporarySave={(template) =>
        saveAndReturn(template, saveTemporaryTemplate)
      }
    />
  );
};
