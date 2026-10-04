import { useState } from 'react';

import { initialPosterTemplates } from '@admin/api/mocks/template';

import type { PosterTemplate } from './templateTypes';

export type TemplateManagementView = 'create' | 'list';

export interface TemplateManagement {
  draftTemplate: PosterTemplate | null;
  hasDraft: boolean;
  openCreate: () => void;
  openDraft: () => void;
  openDraftEditor: (template: PosterTemplate) => void;
  returnToList: () => void;
  saveTemplate: (template: PosterTemplate) => boolean;
  saveTemporaryTemplate: (template: PosterTemplate) => boolean;
  templates: PosterTemplate[];
  updateTemplates: (templates: PosterTemplate[]) => void;
  view: TemplateManagementView;
}

const isDraftTemplate = (template: PosterTemplate) =>
  template.id.startsWith('TPL-DRAFT');

export const useTemplateManagement = (): TemplateManagement => {
  const [view, setView] = useState<TemplateManagementView>('list');
  const [templates, setTemplates] = useState<PosterTemplate[]>(
    initialPosterTemplates,
  );
  const [draftTemplates, setDraftTemplates] = useState<PosterTemplate[]>([]);
  const [editingDraftId, setEditingDraftId] = useState<string | null>(null);

  const returnToList = () => {
    setEditingDraftId(null);
    setView('list');
  };

  const openCreate = () => {
    setEditingDraftId(null);
    setView('create');
  };

  const openDraft = () => {
    setEditingDraftId(draftTemplates[0]?.id ?? null);
    setView('create');
  };

  const openDraftEditor = (template: PosterTemplate) => {
    setEditingDraftId(template.id);
    setView('create');
  };

  const canAddTemplate = (isNewTemplate: boolean) =>
    !isNewTemplate || templates.length + draftTemplates.length < 10;

  const saveTemplate = (template: PosterTemplate) => {
    const isNewTemplate =
      isDraftTemplate(template) &&
      !draftTemplates.some((item) => item.id === template.id);

    if (!canAddTemplate(isNewTemplate)) {
      return false;
    }

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
    returnToList();

    return true;
  };

  const saveTemporaryTemplate = (template: PosterTemplate) => {
    const isNewTemplate = !draftTemplates.some(
      (item) => item.id === template.id,
    );

    if (!canAddTemplate(isNewTemplate)) {
      return false;
    }

    setDraftTemplates((currentTemplates) => [
      template,
      ...currentTemplates.filter((item) => item.id !== template.id),
    ]);
    returnToList();

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
    draftTemplate:
      draftTemplates.find((template) => template.id === editingDraftId) ?? null,
    hasDraft: draftTemplates.length > 0,
    openCreate,
    openDraft,
    openDraftEditor,
    returnToList,
    saveTemplate,
    saveTemporaryTemplate,
    templates: [...draftTemplates, ...templates],
    updateTemplates,
    view,
  };
};
