import type {
  TemplateRecord,
  TemplateStatus as ApiTemplateStatus,
  TemplateVersionRecord,
} from '@admin/api/templates';

export type TemplateStatus = ApiTemplateStatus;
export type PosterTemplate = TemplateRecord;
export type TemplateVersion = TemplateVersionRecord;
