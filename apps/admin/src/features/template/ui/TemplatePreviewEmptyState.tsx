import { Image, Sparkles } from 'lucide-react';

export const TemplatePreviewEmptyState = () => (
  <div className="template-editor__empty-poster flex size-full flex-col items-center justify-center rounded-lg border px-5 text-center shadow-sm">
    {/* 실제 포스터가 아닌 빈 미리보기임을 나타내는 장식이다. */}
    <div
      aria-hidden="true"
      className="template-editor__poster-sketch mb-6 flex w-28 flex-col items-center gap-2 rounded-lg border p-4"
    >
      <span className="h-1.5 w-12 rounded-full bg-current opacity-25" />
      <span className="h-1 w-16 rounded-full bg-current opacity-15" />
      <span className="my-2 flex h-14 w-full items-center justify-center rounded-md border border-dashed">
        <Image className="size-6 opacity-40" />
      </span>
      <span className="h-1 w-14 rounded-full bg-current opacity-20" />
      <span className="h-1 w-10 rounded-full bg-current opacity-15" />
    </div>
    <span className="mb-2 flex items-center gap-1.5 text-caption-web text-text-brand">
      <Sparkles aria-hidden="true" className="size-3.5" />
      아이디어가 포스터로
    </span>
    <p className="text-body-sm-web font-semibold text-text-primary">
      첫 대화를 시작해 보세요
    </p>
    <p className="mt-2 text-caption-web leading-5 text-text-secondary">
      왼쪽에 요청을 입력하면
      <br />
      이곳에서 결과를 확인할 수 있어요.
    </p>
  </div>
);
