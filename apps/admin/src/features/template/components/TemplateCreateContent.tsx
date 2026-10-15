import { useEffect, useRef, useState } from 'react';
import { Button, SelectField } from '@repo/ui';
import { Send } from 'lucide-react';

import { AdminModal } from '@admin/components/AdminModal/AdminModal';
import { ScrollArea } from '@admin/components/ScrollArea/ScrollArea';
import { useTemplateEditor } from '@admin/features/template/useTemplateEditor';

import { QuickPromptButton } from './QuickPromptButton';
import { TemplateChatBubble } from './TemplateChatBubble';
import { TemplateNameModal } from './TemplateNameModal';
import { TemplatePreviewEmptyState } from './TemplatePreviewEmptyState';

export interface TemplateCreateContentProps {
  templateId?: string;
  initialName?: string;
  onBack: () => void;
  onPublished: () => void;
  onCreated: (id: number) => void;
}

interface ChatMessage {
  id: number;
  isAssistant: boolean;
  text: string;
}

const suggestions = [
  '따뜻한 색감의 한식 점심 할인 포스터로 만들어줘',
  '직장인을 위한 파스타 런치 세트 느낌으로 구성해줘',
];

export const TemplateCreateContent = ({
  templateId,
  initialName,
  onBack,
  onPublished,
  onCreated,
}: TemplateCreateContentProps) => {
  const editor = useTemplateEditor(templateId);
  const [name, setName] = useState(initialName ?? '');
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const chatHistoryRef = useRef<HTMLDivElement>(null);
  const persisted = Boolean(editor.template || editor.generation);
  const published = editor.template?.status === 'PUBLISHED';
  const locked = editor.busy || editor.loadingMore;
  const versionNumber =
    selectedVersion ??
    editor.generation?.versionNumber ??
    editor.versions[0]?.versionNumber;
  const version = editor.versions.find(
    (item) => item.versionNumber === versionNumber,
  );
  // 생성 전에는 두 버전 번호가 모두 undefined일 수 있어 생성 결과의 존재도 확인한다.
  const previewHtml =
    version?.html ??
    (editor.generation && editor.generation.versionNumber === versionNumber
      ? editor.generation.html
      : editor.template?.html);
  const displayName = editor.template?.name ?? editor.generation?.name ?? name;

  const versionOptions = editor.versions.map((item) => ({
    label: `버전 ${item.versionNumber}`,
    value: String(item.versionNumber),
  }));
  // 생성은 성공했지만 이력 조회가 실패한 경우에도 최신 결과를 선택할 수 있다.
  const generatedVersionNumber = editor.generation?.versionNumber;
  if (
    generatedVersionNumber !== undefined &&
    !editor.versions.some(
      (item) => item.versionNumber === generatedVersionNumber,
    )
  ) {
    versionOptions.unshift({
      label: `버전 ${generatedVersionNumber}`,
      value: String(generatedVersionNumber),
    });
  }
  useEffect(() => {
    chatHistoryRef.current?.scrollTo({
      top: chatHistoryRef.current.scrollHeight,
    });
  }, [messages, editor.busy, editor.error]);

  const handleSend = async (nextPrompt = prompt) => {
    if (locked || published || !nextPrompt.trim()) return;
    const generated = await editor.generate(displayName, nextPrompt);
    if (!generated) return;
    setPrompt('');
    setSelectedVersion(generated.versionNumber);
    setMessages((current) => [
      ...current,
      { id: Date.now(), isAssistant: false, text: nextPrompt.trim() },
      {
        id: Date.now() + 1,
        isAssistant: true,
        text: `버전 ${generated.versionNumber}을 생성하고 임시저장했습니다.${generated.removedElements.length ? ' 안전하지 않은 태그와 속성은 제거했습니다.' : ''}`,
      },
    ]);
    if (!templateId) onCreated(generated.templateId);
  };

  const handlePublish = async () => {
    if (versionNumber === undefined) return;
    if (await editor.publish(versionNumber)) onPublished();
  };

  // 새 작성 주소로 직접 들어온 경우에도 이름을 정한 뒤 생성 요청을 보낸다.
  if (!templateId && !name)
    return <TemplateNameModal onClose={onBack} onStart={setName} />;

  if (editor.loading || editor.loadError)
    return (
      <section className="flex flex-col gap-4">
        <Button variant="tertiary" onClick={onBack}>
          목록으로
        </Button>
        <p
          role={editor.loadError ? 'alert' : 'status'}
          className="text-body-sm-web text-text-secondary"
        >
          {editor.loadError ?? '템플릿을 불러오는 중입니다.'}
        </p>
      </section>
    );

  return (
    <section className="flex h-full min-h-0 min-w-0 flex-col">
      <ScrollArea
        aria-label="템플릿 편집 영역"
        orientation="horizontal"
        tabIndex={0}
        className="min-w-0 rounded-xl border border-border-subtle shadow-sm focus-visible:outline-2 focus-visible:outline-action-primary"
      >
        {/* 세 영역을 함께 보며 편집할 수 있도록 최소 작업 너비 아래에서만 가로로 스크롤한다. */}
        <div className="grid h-full min-h-0 min-w-[800px] grid-cols-[minmax(240px,0.8fr)_minmax(240px,1fr)_minmax(300px,1.2fr)]">
          <section className="flex min-h-0 min-w-0 flex-col border-r border-border-subtle">
            <ScrollArea
              className="flex flex-col gap-4 p-4"
              ref={chatHistoryRef}
            >
              <TemplateChatBubble variant="assistant">
                {published
                  ? '게시된 템플릿입니다. 게시 후에는 수정할 수 없습니다.'
                  : '만들고 싶은 포스터의 분위기와 홍보 내용을 알려주세요. 생성된 버전은 자동으로 임시저장됩니다.'}
              </TemplateChatBubble>
              {messages.map((message) => (
                <TemplateChatBubble
                  key={message.id}
                  variant={message.isAssistant ? 'assistant' : 'user'}
                >
                  {message.text}
                </TemplateChatBubble>
              ))}
              {editor.busy && <TemplateChatBubble variant="loading" />}
              {editor.error && (
                <p
                  role="alert"
                  className="text-body-sm-web text-status-danger-fg"
                >
                  {editor.error}
                </p>
              )}
            </ScrollArea>
            {!published && (
              <div className="flex flex-col gap-3 border-t border-border-subtle p-4">
                {!persisted && (
                  <div className="flex flex-col items-start gap-1.5">
                    {suggestions.map((suggestion) => (
                      <QuickPromptButton
                        key={suggestion}
                        label={suggestion}
                        disabled={locked || !displayName.trim()}
                        onClick={() => void handleSend(suggestion)}
                      />
                    ))}
                  </div>
                )}
                <label htmlFor="template-request" className="sr-only">
                  템플릿 생성·수정 요청
                </label>
                <div className="relative">
                  <textarea
                    id="template-request"
                    className="h-20 w-full resize-none rounded-md border border-border-subtle bg-bg-surface px-3 py-2 pr-12 text-body-sm-web text-text-primary focus:border-action-primary focus:outline-none"
                    maxLength={500}
                    disabled={locked}
                    value={prompt}
                    onChange={(event) => setPrompt(event.target.value)}
                    placeholder="원하는 분위기나 수정 내용을 입력해 주세요"
                    onKeyDown={(event) => {
                      if (
                        event.key === 'Enter' &&
                        !event.shiftKey &&
                        !event.nativeEvent.isComposing
                      ) {
                        event.preventDefault();
                        void handleSend();
                      }
                    }}
                  />
                  <button
                    type="button"
                    aria-label="생성·수정 요청 보내기"
                    className="absolute bottom-3 right-3 flex size-8 items-center justify-center rounded-md text-text-secondary hover:bg-surface-subtle hover:text-action-primary disabled:cursor-not-allowed disabled:text-text-disabled focus-visible:outline-2 focus-visible:outline-action-primary"
                    disabled={locked || !displayName.trim() || !prompt.trim()}
                    onClick={() => void handleSend()}
                  >
                    <Send aria-hidden="true" className="size-4" />
                  </button>
                </div>
              </div>
            )}
          </section>
          <section className="flex min-h-0 min-w-0 flex-col border-r border-border-subtle bg-surface-subtle p-2">
            <div className="grid min-h-0 flex-1 place-items-center overflow-hidden [container-type:inline-size]">
              <div className="aspect-[210/297] h-[min(100%,141.428cqw)] max-w-full">
                {previewHtml ? (
                  <iframe
                    className="size-full rounded-lg border border-border-subtle bg-bg-page shadow-md"
                    // 서버 HTML을 부모 페이지와 분리하고 스크립트 실행을 허용하지 않는다.
                    sandbox=""
                    srcDoc={previewHtml}
                    title={`${displayName || '템플릿'} 미리보기`}
                  />
                ) : (
                  <TemplatePreviewEmptyState />
                )}
              </div>
            </div>
          </section>
          <section className="flex min-h-0 min-w-0 flex-col gap-4 bg-bg-surface p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              {!published && (
                <SelectField
                  aria-label="미리보기 및 게시할 버전 선택"
                  fitContent
                  size="compact"
                  disabled={locked || versionNumber === undefined}
                  placeholder="버전 선택"
                  value={
                    versionNumber === undefined ? '' : String(versionNumber)
                  }
                  options={versionOptions}
                  onValueChange={(value) => setSelectedVersion(Number(value))}
                />
              )}
              {editor.nextPageToken && (
                <Button
                  className="!min-h-8"
                  variant="tertiary"
                  disabled={locked}
                  onClick={() => void editor.loadMore()}
                >
                  {editor.loadingMore ? '불러오는 중' : '이전 버전 불러오기'}
                </Button>
              )}
            </div>
            {previewHtml ? (
              <ScrollArea
                aria-label="선택한 템플릿의 HTML"
                role="region"
                tabIndex={0}
                className="min-w-0 overflow-x-auto overscroll-x-contain rounded-md border border-border-subtle bg-surface-subtle focus-visible:outline-2 focus-visible:outline-action-primary"
              >
                <pre className="m-0 w-max min-w-full p-3 font-mono text-caption-web text-text-primary">
                  <code>{previewHtml}</code>
                </pre>
              </ScrollArea>
            ) : (
              <div className="flex min-h-0 flex-1 items-center justify-center rounded-md border border-border-subtle bg-surface-subtle p-4 text-center text-body-sm-web text-text-secondary">
                템플릿을 생성하면 HTML이 표시됩니다.
              </div>
            )}
            <div className="mt-auto flex flex-col gap-3">
              <p className="text-caption-web text-text-secondary">
                생성·수정 결과는 임시저장됩니다. 게시한 뒤 목록에서 활성화하면
                점주에게 노출됩니다.
              </p>
              <div className="flex justify-end gap-2">
                <Button variant="secondary" disabled={locked} onClick={onBack}>
                  목록으로
                </Button>
                {!published && (
                  <Button
                    disabled={
                      locked || !editor.template || versionNumber === undefined
                    }
                    onClick={() => setPublishModalOpen(true)}
                  >
                    게시
                  </Button>
                )}
              </div>
            </div>
          </section>
        </div>
      </ScrollArea>

      <AdminModal
        title="템플릿 게시"
        open={publishModalOpen}
        onClose={() => {
          if (!editor.busy) setPublishModalOpen(false);
        }}
      >
        <div className="flex flex-col gap-6">
          <p className="text-body-sm-web text-text-secondary">
            버전 {versionNumber}을 게시하시겠습니까? 게시하면 모든 임시저장
            버전이 삭제되며 이후 수정할 수 없습니다. 점주 노출 여부는 목록에서
            설정할 수 있습니다.
          </p>
          {editor.error && (
            <p role="alert" className="text-caption-web text-status-danger-fg">
              {editor.error}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              disabled={editor.busy}
              onClick={() => setPublishModalOpen(false)}
            >
              취소
            </Button>
            <Button disabled={editor.busy} onClick={() => void handlePublish()}>
              {editor.busy ? '게시 중' : '게시'}
            </Button>
          </div>
        </div>
      </AdminModal>
    </section>
  );
};
