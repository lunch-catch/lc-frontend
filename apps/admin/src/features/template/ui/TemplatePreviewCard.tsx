import { Button, StatusBadge, Toggle } from '@repo/ui';
import { formatDateTime } from '@repo/utils';
import { Trash2 } from 'lucide-react';

import type { PosterTemplate } from '../templateTypes';
import { TemplateThumbnail } from './TemplateThumbnail';

export interface TemplatePreviewCardProps {
  onActivationRequest: (template: PosterTemplate) => void;
  onOpenTemplate: (template: PosterTemplate) => void;
  onDeleteRequest: (template: PosterTemplate) => void;
  template: PosterTemplate;
}

export const TemplatePreviewCard = ({
  onActivationRequest,
  onOpenTemplate,
  onDeleteRequest,
  template,
}: TemplatePreviewCardProps) => {
  const canChangeActivation = template.status === 'PUBLISHED';
  const openLabel = canChangeActivation ? '상세보기' : '수정';
  // 수정 시각이 없는 데이터는 최초 등록 시각으로 대체하지 않고 빈 값으로 표시한다.
  const modifiedAt = template.lastModifiedAt;

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
          variant={canChangeActivation ? 'success' : 'neutral'}
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

      <dl className="space-y-1.5 px-3 py-3 text-caption-web text-text-secondary">
        <div className="flex items-baseline gap-1.5">
          <dt className="shrink-0">최종 수정일:</dt>
          <dd className="min-w-0 tabular-nums">
            {modifiedAt ? formatDateTime(modifiedAt) : '—'}
          </dd>
        </div>
        <div className="flex items-baseline gap-1.5">
          <dt className="shrink-0">최종 수정자:</dt>
          {/* 목록 API는 수정자의 이름 대신 관리자 내부 ID를 제공한다. */}
          <dd className="min-w-0">
            {template.lastModifiedBy == null
              ? '—'
              : '관리자 #' + template.lastModifiedBy}
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
          <Button
            aria-label={`${template.name} 삭제`}
            className="!min-h-8 !px-2 !py-1 text-caption-web"
            variant="neutral"
            leadingIcon={<Trash2 aria-hidden="true" className="size-3.5" />}
            onClick={() => onDeleteRequest(template)}
          >
            삭제
          </Button>
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
