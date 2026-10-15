import { Button, StatusBadge, Toggle } from '@repo/ui';
import { formatDate, formatDateTime } from '@repo/utils';

import type { PosterTemplate } from '@admin/features/template/templateTypes';

import { TemplateThumbnail } from './TemplateThumbnail';

export interface TemplatePreviewCardProps {
  onActivationRequest: (template: PosterTemplate) => void;
  onOpenTemplate: (template: PosterTemplate) => void;
  template: PosterTemplate;
}

export const TemplatePreviewCard = ({
  onActivationRequest,
  onOpenTemplate,
  template,
}: TemplatePreviewCardProps) => {
  const canChangeActivation = template.status === 'PUBLISHED';
  const openLabel = canChangeActivation ? '상세보기' : '수정';
  const modifiedAt = template.lastModifiedAt ?? template.createdAt;

  return (
    <article className="flex min-w-0 flex-col overflow-hidden rounded-xl border border-border-subtle bg-bg-surface transition-shadow hover:shadow-md">
      <header className="flex min-h-12 items-center justify-between gap-2 px-3 py-2">
        <h3
          className="min-w-0 flex-1 truncate text-body-sm-web font-semibold text-text-primary"
          title={template.name}
        >
          {template.name}
        </h3>
        <StatusBadge
          className="shrink-0"
          variant={canChangeActivation ? 'info' : 'neutral'}
        >
          {canChangeActivation ? '게시됨' : '임시저장 중'}
        </StatusBadge>
      </header>

      <button
        aria-label={`${template.name} ${openLabel}`}
        className="block w-full bg-surface-subtle p-2 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-action-primary"
        onClick={() => onOpenTemplate(template)}
        type="button"
      >
        <TemplateThumbnail html={template.html} name={template.name} />
      </button>

      <dl className="grid grid-cols-2 gap-2 px-3 py-2 text-caption-web text-text-secondary">
        <div className="min-w-0">
          <dt>최초 등록일</dt>
          <dd
            className="mt-1 whitespace-nowrap"
            title={formatDateTime(template.createdAt)}
          >
            {formatDate(template.createdAt)}
          </dd>
        </div>
        <div className="min-w-0 text-right">
          <dt>최종 수정일</dt>
          <dd
            className="mt-1 whitespace-nowrap"
            title={formatDateTime(modifiedAt)}
          >
            {formatDate(modifiedAt)}
          </dd>
        </div>
      </dl>

      <footer className="flex items-center justify-between gap-2 border-t border-border-subtle p-3">
        {canChangeActivation ? (
          <Toggle
            aria-label={`${template.name} 점주 노출`}
            checked={template.active}
            label={template.active ? '활성' : '비활성'}
            onChange={() => onActivationRequest(template)}
          />
        ) : (
          <span className="text-caption-web text-text-secondary">
            게시 전 초안
          </span>
        )}
        <Button
          className="shrink-0 !min-h-8 !px-2 !py-1 text-caption-web"
          onClick={() => onOpenTemplate(template)}
          variant="neutral"
        >
          {openLabel}
        </Button>
      </footer>
    </article>
  );
};
