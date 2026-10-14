import { useCallback, useEffect, useState } from 'react';

import { changeTemplateActive, getTemplates } from '@admin/api/templates';
import { useAdminAuth } from '@admin/auth/useAdminAuth';

import type { PosterTemplate } from './templateTypes';
import { getTemplateError } from './templateUtils';

export interface TemplateManagement {
  hasDraft: boolean;
  templates: PosterTemplate[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
  changeActive: (template: PosterTemplate) => Promise<void>;
}

interface TemplateListResult {
  adminId: number;
  revision: number;
  templates: PosterTemplate[];
  error: string | null;
}

export const useTemplateManagementState = (): TemplateManagement => {
  const { admin } = useAdminAuth();
  const adminId = admin?.adminId;
  // 재조회마다 키를 바꿔 이전 요청의 응답을 현재 목록으로 표시하지 않는다.
  const [revision, setRevision] = useState(0);
  const [result, setResult] = useState<TemplateListResult | null>(null);
  const refresh = useCallback(() => setRevision((current) => current + 1), []);

  useEffect(() => {
    if (adminId === undefined) return;
    const controller = new AbortController();
    void getTemplates(controller.signal).then(
      (templates) => {
        if (!controller.signal.aborted)
          setResult({ adminId, revision, templates, error: null });
      },
      (error: unknown) => {
        if (!controller.signal.aborted)
          setResult({
            adminId,
            revision,
            templates: [],
            error: getTemplateError(error),
          });
      },
    );
    return () => controller.abort();
  }, [adminId, revision]);

  // 로그아웃·계정 변경 직후에는 이전 계정의 목록을 표시하지 않는다.
  const current =
    result?.adminId === adminId && result?.revision === revision
      ? result
      : null;
  const templates = current?.templates ?? [];
  const changeActive = async (template: PosterTemplate) => {
    const response = await changeTemplateActive(
      String(template.templateId),
      !template.active,
    );
    setResult((previous) =>
      previous && previous.adminId === adminId
        ? {
            ...previous,
            templates: previous.templates.map((item) =>
              item.templateId === response.templateId
                ? {
                    ...item,
                    active: response.active,
                    activatedBy: response.activatedBy,
                    activatedAt: response.activatedAt,
                  }
                : item,
            ),
          }
        : previous,
    );
  };

  return {
    templates,
    hasDraft: templates.some((item) => item.status === 'DRAFT'),
    loading: adminId !== undefined && !current,
    error: current?.error ?? null,
    refresh,
    changeActive,
  };
};
