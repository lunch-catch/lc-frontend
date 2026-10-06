import { useNavigate } from 'react-router';

import { TemplateManagementContent } from '@admin/features/template/components/TemplateManagementContent';
import type { PosterTemplate } from '@admin/features/template/templateTypes';
import { useTemplateManagement } from '@admin/features/template/useTemplateManagement';

export const TemplateManagementPage = () => {
  const navigate = useNavigate();
  const { hasDraft, templates, updateTemplates } = useTemplateManagement();
  const openDraft = (template: PosterTemplate) => {
    void navigate(`/templates/drafts/${encodeURIComponent(template.id)}/edit`);
  };

  return (
    <TemplateManagementContent
      hasDraft={hasDraft}
      templates={templates}
      onTemplatesChange={updateTemplates}
      onCreate={() => void navigate('/templates/new')}
      onEditDraft={openDraft}
      onLoadDraft={() => {
        const draft = templates.find((template) => template.status === 'DRAFT');
        if (draft) openDraft(draft);
      }}
    />
  );
};
