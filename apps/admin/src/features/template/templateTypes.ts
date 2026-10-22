import type {
  TemplateRecord,
  TemplateStatus as ApiTemplateStatus,
  TemplateVersionRecord,
} from '@admin/api/templates';

export type TemplateStatus = ApiTemplateStatus;
export type PosterTemplate = TemplateRecord;
export type TemplateVersion = TemplateVersionRecord;
// 재조회 실패나 미조회 페이지에 있는 버전은 삭제로 단정하지 않고 unknown으로 구분한다.
export type TemplateVersionAvailability = 'available' | 'deleted' | 'unknown';
