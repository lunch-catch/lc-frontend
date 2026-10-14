import { useEffect } from 'react';
import { useNavigate } from 'react-router';

import { TemplateManagementContent } from '@admin/features/template/components/TemplateManagementContent';
import type { PosterTemplate } from '@admin/features/template/templateTypes';
import { useTemplateManagement } from '@admin/features/template/useTemplateManagement';

export const TemplateManagementPage = () => {
  const navigate = useNavigate();
  const management = useTemplateManagement();
  const { refresh } = management;
  useEffect(() => {
    refresh();
  }, [refresh]);
  const openTemplate = (template: PosterTemplate) => {
    void navigate(
      template.status === 'DRAFT'
        ? `/templates/drafts/${template.templateId}/edit`
        : `/templates/${template.templateId}`,
    );
  };

  return (
    <TemplateManagementContent
      {...management}
      onCreate={(name) =>
        void navigate('/templates/new', { state: { templateName: name } })
      }
      onOpenTemplate={openTemplate}
      onLoadDraft={() => {
        const draft = management.templates.find(
          (template) => template.status === 'DRAFT',
        );
        if (draft) openTemplate(draft);
      }}
    />
  );
};
