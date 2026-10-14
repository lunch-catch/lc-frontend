import { useLocation, useNavigate, useParams } from 'react-router';

import { TemplateCreateContent } from '@admin/features/template/components/TemplateCreateContent';
import { getValidTemplateName } from '@admin/features/template/templateUtils';
import { useTemplateManagement } from '@admin/features/template/useTemplateManagement';

export const TemplateCreatePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const routeState = location.state as {
    templateName?: unknown;
    createdTemplateId?: unknown;
  } | null;
  const initialName = getValidTemplateName(routeState?.templateName);
  const { templateId } = useParams();
  // 첫 생성의 주소 변경에서는 대화를 유지하고, 다른 템플릿을 열면 작성 상태를 분리한다.
  const editorKey =
    templateId && routeState?.createdTemplateId !== templateId
      ? templateId
      : 'new';
  const { refresh } = useTemplateManagement();
  const returnToList = () => {
    refresh();
    void navigate('/templates');
  };

  return (
    <TemplateCreateContent
      key={editorKey}
      templateId={templateId}
      initialName={initialName}
      onBack={returnToList}
      onPublished={returnToList}
      onCreated={(id) => {
        refresh();
        void navigate(`/templates/drafts/${id}/edit`, {
          replace: true,
          state: { createdTemplateId: String(id) },
        });
      }}
    />
  );
};
