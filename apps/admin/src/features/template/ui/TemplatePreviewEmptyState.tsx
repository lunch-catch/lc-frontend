import { MessageSquareText } from 'lucide-react';

export const TemplatePreviewEmptyState = () => (
  <div className="flex size-full flex-col items-center justify-center rounded-lg border border-border-subtle bg-bg-surface px-6 text-center shadow-md">
    <span className="flex size-10 items-center justify-center rounded-full bg-surface-subtle text-text-secondary">
      <MessageSquareText aria-hidden="true" className="size-5" />
    </span>
    <p className="mt-4 text-body-sm-web font-semibold text-text-primary">
      채팅을 보내 템플릿을 생성해 보세요
    </p>
    <p className="mt-2 text-caption-web leading-5 text-text-secondary">
      요청한 내용에 맞춰 포스터 미리보기를 만들어 드려요.
    </p>
  </div>
);
