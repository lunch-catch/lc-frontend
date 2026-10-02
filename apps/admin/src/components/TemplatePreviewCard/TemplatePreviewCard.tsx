import { Toggle } from '@repo/ui';
import { formatDateTime } from '@repo/utils';

import {
  getTemplatePreviewHtml,
  type PosterTemplate,
} from '@admin/features/template/templateData';

export interface TemplatePreviewCardProps {
  onActivationRequest: (template: PosterTemplate) => void;
  template: PosterTemplate;
}

export const TemplatePreviewCard = ({
  onActivationRequest,
  template,
}: TemplatePreviewCardProps) => {
  const canChangeActivation = template.status === 'PUBLISHED';

  return (
    <article className="flex min-w-0 flex-col rounded-xl border border-border-subtle bg-bg-surface p-4 shadow-sm">
      <header>
        <div className="min-w-0">
          <h3 className="truncate text-title-sm-web font-semibold text-text-primary">
            {template.name}
          </h3>
          <p className="mt-1 text-caption-web text-text-secondary">
            {template.id}
          </p>
        </div>
      </header>

      <iframe
        className="mt-4 aspect-[210/297] w-full rounded-lg border border-border-subtle bg-bg-page"
        sandbox=""
        srcDoc={getTemplatePreviewHtml(template)}
        title={`${template.name} 미리보기`}
      />

      <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2 text-caption-web">
        <div>
          <dt className="text-text-secondary">등록일</dt>
          <dd className="mt-1 font-medium text-text-primary">
            {formatDateTime(template.createdAt)}
          </dd>
        </div>
        <div>
          <dt className="text-text-secondary">사용 횟수</dt>
          <dd className="mt-1 font-medium text-text-primary">
            {template.usageCount.toLocaleString()}회
          </dd>
        </div>
      </dl>

      <div className="mt-4 flex items-center justify-between border-t border-border-subtle pt-3">
        <span className="text-caption-web text-text-secondary">
          {canChangeActivation
            ? template.isActive
              ? '점주에게 노출 중'
              : '점주에게 미노출'
            : '게시 후 설정 가능'}
        </span>
        {canChangeActivation ? (
          <Toggle
            checked={template.isActive}
            label={template.isActive ? '활성' : '비활성'}
            onChange={() => onActivationRequest(template)}
          />
        ) : (
          <span className="text-caption-web font-medium text-text-tertiary">
            비활성
          </span>
        )}
      </div>
    </article>
  );
};
