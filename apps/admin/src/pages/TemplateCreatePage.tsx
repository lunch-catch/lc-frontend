import { useLocation, useNavigate, useParams } from 'react-router';

import { TemplateCreateContent } from '@admin/features/template/components/TemplateCreateContent';
import { getValidTemplateName } from '@admin/features/template/templateUtils';
import { useTemplateManagement } from '@admin/features/template/useTemplateManagement';

export const TemplateCreatePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const routeState = location.state as { templateName?: unknown } | null;
  const initialName = getValidTemplateName(routeState?.templateName);
  const { templateId } = useParams();
  const { refresh } = useTemplateManagement();
  const returnToList = () => {
    refresh();
    void navigate('/templates');
  };

  return (
    <TemplateCreateContent
      key={templateId ?? 'new'}
      templateId={templateId}
      initialName={initialName}
      onBack={returnToList}
      onPublished={returnToList}
      onCreated={(id) => {
        refresh();
        void navigate(`/templates/drafts/${id}/edit`, { replace: true });
      }}
    />
  );
};
