import { useState } from 'react';

import { initialPosterTemplates } from '@admin/api/mocks/template';

import type { PosterTemplate } from './templateTypes';

export interface TemplateManagement {
  hasDraft: boolean;
  saveTemplate: (template: PosterTemplate) => boolean;
  saveTemporaryTemplate: (template: PosterTemplate) => boolean;
  templates: PosterTemplate[];
  updateTemplates: (templates: PosterTemplate[]) => void;
}

const isDraftTemplate = (template: PosterTemplate) =>
  template.id.startsWith('TPL-DRAFT');

// 화면 선택은 URL이 담당하고 이 훅은 목록·작성 화면이 공유하는 데이터만 유지한다.
export const useTemplateManagementState = (): TemplateManagement => {
  const [templates, setTemplates] = useState<PosterTemplate[]>(
    initialPosterTemplates,
  );
  const [draftTemplates, setDraftTemplates] = useState<PosterTemplate[]>([]);
  const canAddTemplate = (isNewTemplate: boolean) =>
    !isNewTemplate || templates.length + draftTemplates.length < 10;

  const saveTemplate = (template: PosterTemplate) => {
    const isNewTemplate =
      isDraftTemplate(template) &&
      !draftTemplates.some((item) => item.id === template.id);
    if (!canAddTemplate(isNewTemplate)) return false;
    setTemplates((currentTemplates) => [
      {
        ...template,
        id: isDraftTemplate(template)
          ? `TPL-${String(currentTemplates.length + 1).padStart(4, '0')}`
          : template.id,
      },
      ...currentTemplates.filter((item) => item.id !== template.id),
    ]);
    setDraftTemplates((currentTemplates) =>
      currentTemplates.filter((item) => item.id !== template.id),
    );
    return true;
  };

  const saveTemporaryTemplate = (template: PosterTemplate) => {
    const isNewTemplate = !draftTemplates.some(
      (item) => item.id === template.id,
    );
    if (!canAddTemplate(isNewTemplate)) return false;
    setDraftTemplates((currentTemplates) => [
      template,
      ...currentTemplates.filter((item) => item.id !== template.id),
    ]);
    return true;
  };

  const updateTemplates = (nextTemplates: PosterTemplate[]) => {
    setTemplates((currentTemplates) =>
      currentTemplates.map(
        (template) =>
          nextTemplates.find(
            (nextTemplate) => nextTemplate.id === template.id,
          ) ?? template,
      ),
    );
  };

  return {
    hasDraft: draftTemplates.length > 0,
    saveTemplate,
    saveTemporaryTemplate,
    templates: [...draftTemplates, ...templates],
    updateTemplates,
  };
};
