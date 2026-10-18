import { Fragment, useEffect, useRef, useState } from 'react';
import { Button, StatusBadge } from '@repo/ui';
import { Code2, MousePointer2, Send, X } from 'lucide-react';

import { AdminModal } from '@admin/ui/AdminModal/AdminModal';
import { ScrollArea } from '@admin/ui/ScrollArea/ScrollArea';

import {
  buildSelectedTemplatePrompt,
  type TemplateSelection,
} from '../templateSelection';
import { useTemplateEditor } from '../useTemplateEditor';
import { SelectableTemplatePreview } from './SelectableTemplatePreview';
import { TemplateChatBubble } from './TemplateChatBubble';
import { TemplateHtmlCode } from './TemplateHtmlCode';
import { TemplateNameModal } from './TemplateNameModal';
import { TemplatePreviewEmptyState } from './TemplatePreviewEmptyState';
import { TemplateVersionMessage } from './TemplateVersionMessage';

export interface TemplateCreateContentProps {
  templateId?: string;
  initialName?: string;
  onBack: () => void;
  onPublished: () => void;
  onCreated: (id: number) => void;
}

interface TemplateChatEntry {
  versionNumber: number;
  html: string;
  text: string;
  targetLabel?: string;
  hasRemovedElements: boolean;
}

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
  const [messages, setMessages] = useState<TemplateChatEntry[]>([]);
  const [pendingMessage, setPendingMessage] = useState<Pick<
    TemplateChatEntry,
    'text' | 'targetLabel'
  > | null>(null);
  const sendingRef = useRef(false);
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [pendingVersion, setPendingVersion] = useState<number | null>(null);
  const [selectionContext, setSelectionContext] = useState<{
    html: string;
    version?: number;
    target: TemplateSelection;
  } | null>(null);
  const [selectionError, setSelectionError] = useState('');
  const promptRef = useRef<HTMLTextAreaElement>(null);
  const chatHistoryRef = useRef<HTMLDivElement>(null);
  const published = editor.template?.status === 'PUBLISHED';
  const locked = editor.busy || editor.loadingMore || pendingMessage !== null;
  const latestVersionNumber =
    Math.max(
      0,
      editor.generation &&
        editor.getVersionAvailability(editor.generation.versionNumber) ===
          'available'
        ? editor.generation.versionNumber
        : 0,
      ...editor.versions
        .filter(
          (item) =>
            editor.getVersionAvailability(item.versionNumber) === 'available',
        )
        .map((item) => item.versionNumber),
    ) || undefined;
  const versionNumber =
    selectedVersion !== null &&
    editor.getVersionAvailability(selectedVersion) === 'available'
      ? selectedVersion
      : latestVersionNumber;
  const version = editor.versions.find(
    (item) => item.versionNumber === versionNumber,
  );
  // 대화의 HTML은 서버에 남아 있는 버전만 미리보기와 저장에 사용할 수 있다.
  const localVersion = messages.find(
    (message) =>
      message.versionNumber === versionNumber &&
      editor.getVersionAvailability(message.versionNumber) === 'available',
  );
  const generatedHtml =
    editor.generation && editor.generation.versionNumber === versionNumber
      ? editor.generation.html
      : undefined;
  const previewHtml =
    version?.html ??
    localVersion?.html ??
    generatedHtml ??
    editor.template?.html;
  const displayName = editor.template?.name ?? editor.generation?.name ?? name;
  // 다른 버전의 코드를 현재 버전의 수정 대상으로 보내지 않는다.
  const selectedTarget =
    selectionContext &&
    selectionContext.html === previewHtml &&
    selectionContext.version === versionNumber
      ? selectionContext.target
      : null;
  const selectTarget = (target: TemplateSelection) => {
    if (locked || published || !previewHtml) return;
    setSelectionContext({ html: previewHtml, version: versionNumber, target });
    setSelectionError('');
    promptRef.current?.focus({ preventScroll: true });
  };

  // 이번 대화에서 이미 표시한 버전은 서버 이력과 중복해서 표시하지 않는다.
  const messageVersions = new Set(
    messages.map((message) => message.versionNumber),
  );
  const previousVersions = editor.versions
    .filter((item) => !messageVersions.has(item.versionNumber))
    .map((item) => item.versionNumber)
    .sort((a, b) => a - b);
  const requestVersionChange = (nextVersion: number) => {
    if (
      !locked &&
      nextVersion !== versionNumber &&
      editor.getVersionAvailability(nextVersion) === 'available'
    )
      setPendingVersion(nextVersion);
  };
  const confirmVersionChange = () => {
    if (
      locked ||
      pendingVersion === null ||
      editor.getVersionAvailability(pendingVersion) !== 'available'
    )
      return;
    // 버전 이동은 조회 상태만 바꾼다. 서버의 최신 버전이나 이후 이력은 변경하지 않는다.
    setSelectedVersion(pendingVersion);
    setSelectionContext(null);
    setSelectionError('');
    setPendingVersion(null);
  };
  useEffect(() => {
    chatHistoryRef.current?.scrollTo({
      top: chatHistoryRef.current.scrollHeight,
    });
  }, [messages, pendingMessage, editor.busy, editor.error, editor.loading]);

  const handleSend = async () => {
    if (sendingRef.current || locked || published || !prompt.trim()) return;
    let requestPrompt: string;
    try {
      requestPrompt = buildSelectedTemplatePrompt(prompt, selectedTarget);
    } catch (cause) {
      setSelectionError(
        cause instanceof Error
          ? cause.message
          : '수정 대상을 다시 선택해 주세요.',
      );
      return;
    }
    setSelectionError('');
    const submittedPrompt = prompt;
    sendingRef.current = true;
    // 응답 전에 말풍선을 표시하고, 실패하면 원문을 복구해 같은 요청을 재시도할 수 있게 한다.
    setPrompt('');
    setPendingMessage({
      text: submittedPrompt.trim(),
      targetLabel: selectedTarget?.label,
    });
    try {
      const generated = await editor.generate(
        displayName,
        requestPrompt,
        versionNumber,
      );
      if (!generated) {
        setPrompt(submittedPrompt);
        return;
      }
      setSelectionContext(null);
      setSelectedVersion(generated.versionNumber);
      setMessages((current) => [
        ...current,
        {
          versionNumber: generated.versionNumber,
          html: generated.html,
          text: submittedPrompt.trim(),
          targetLabel: selectedTarget?.label,
          hasRemovedElements: generated.removedElements.length > 0,
        },
      ]);
      if (!templateId) onCreated(generated.templateId);
    } finally {
      sendingRef.current = false;
      setPendingMessage(null);
    }
  };

  const handleSave = async () => {
    if (versionNumber === undefined) return;
    // 최종 저장 버튼은 선택한 버전을 확정하는 기존 게시 API를 사용한다.
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
        hideScrollbar
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
              {published && (
                <TemplateChatBubble variant="assistant">
                  최종 저장된 템플릿입니다. 이후에는 수정할 수 없습니다.
                </TemplateChatBubble>
              )}
              {editor.nextPageToken && (
                <Button
                  className="!min-h-8 self-center"
                  variant="tertiary"
                  disabled={locked}
                  onClick={() => void editor.loadMore()}
                >
                  {editor.loadingMore ? '불러오는 중' : '이전 버전 불러오기'}
                </Button>
              )}
              {previousVersions.map((number) => (
                <TemplateVersionMessage
                  key={number}
                  versionNumber={number}
                  current={number === versionNumber}
                  disabled={locked}
                  availability={editor.getVersionAvailability(number)}
                  onSelect={requestVersionChange}
                />
              ))}
              {messages.map((message) => (
                <Fragment key={message.versionNumber}>
                  <TemplateChatBubble variant="user">
                    {message.targetLabel && (
                      <span className="mb-1 block text-caption-web text-text-secondary">
                        수정 대상 · {message.targetLabel}
                      </span>
                    )}
                    {message.text}
                  </TemplateChatBubble>
                  <TemplateVersionMessage
                    versionNumber={message.versionNumber}
                    current={message.versionNumber === versionNumber}
                    disabled={locked}
                    availability={editor.getVersionAvailability(
                      message.versionNumber,
                    )}
                    onSelect={requestVersionChange}
                  />
                  {message.hasRemovedElements && (
                    <TemplateChatBubble variant="assistant">
                      안전하지 않은 태그와 속성은 제거했습니다.
                    </TemplateChatBubble>
                  )}
                </Fragment>
              ))}
              {pendingMessage && (
                <TemplateChatBubble variant="user">
                  {pendingMessage.targetLabel && (
                    <span className="mb-1 block text-caption-web text-text-secondary">
                      수정 대상 · {pendingMessage.targetLabel}
                    </span>
                  )}
                  {pendingMessage.text}
                </TemplateChatBubble>
              )}
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
                <label htmlFor="template-request" className="sr-only">
                  템플릿 생성·수정 요청
                </label>
                <div
                  className={`relative flex flex-col rounded-lg border bg-bg-surface transition-colors focus-within:border-action-primary ${selectedTarget ? 'border-action-primary/40' : 'border-border-subtle'}`}
                >
                  {selectedTarget && (
                    <StatusBadge
                      variant="neutral"
                      className="ml-3 mt-2 h-6 max-w-[calc(100%-1.5rem)] gap-1.5 self-start border border-border-subtle"
                      style={{
                        paddingBlock: 0,
                        paddingInline: 'var(--space-2)',
                      }}
                    >
                      {selectedTarget.source === 'code' ? (
                        <Code2 aria-hidden="true" className="size-3 shrink-0" />
                      ) : (
                        <MousePointer2
                          aria-hidden="true"
                          className="size-3 shrink-0"
                        />
                      )}
                      <span
                        id="template-selection-label"
                        className="min-w-0 truncate"
                        title={selectedTarget.label}
                      >
                        <span className="sr-only">수정 대상: </span>
                        {selectedTarget.label}
                      </span>
                      <button
                        type="button"
                        aria-label="수정 대상 선택 해제"
                        disabled={locked}
                        className="flex size-5 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-text-primary/10 focus-visible:outline-2 focus-visible:outline-action-primary disabled:opacity-50"
                        onClick={() => {
                          setSelectionContext(null);
                          setSelectionError('');
                          promptRef.current?.focus();
                        }}
                      >
                        <X aria-hidden="true" className="size-3" />
                      </button>
                    </StatusBadge>
                  )}
                  <textarea
                    ref={promptRef}
                    id="template-request"
                    className="ui-scrollbar block h-20 w-full resize-none overflow-y-auto overscroll-y-contain rounded-md border-0 bg-transparent px-3 py-2 pr-12 text-body-sm-web text-text-primary focus:outline-none"
                    aria-describedby={
                      selectedTarget ? 'template-selection-label' : undefined
                    }
                    maxLength={500}
                    disabled={locked}
                    value={prompt}
                    onChange={(event) => {
                      setPrompt(event.target.value);
                      setSelectionError('');
                    }}
                    placeholder={
                      selectedTarget
                        ? '선택한 부분의 수정 내용을 입력해 주세요'
                        : '원하는 분위기나 수정 내용을 입력해 주세요'
                    }
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
                    className="absolute bottom-3 right-3 flex size-8 items-center justify-center rounded-md text-action-primary enabled:hover:bg-surface-brand enabled:hover:text-action-primary-hover disabled:cursor-not-allowed disabled:text-text-disabled focus-visible:outline-2 focus-visible:outline-action-primary"
                    disabled={locked || !displayName.trim() || !prompt.trim()}
                    onClick={() => void handleSend()}
                  >
                    <Send aria-hidden="true" className="size-4" />
                  </button>
                </div>
                {selectionError && (
                  <p
                    role="alert"
                    className="text-caption-web text-status-danger-fg"
                  >
                    {selectionError}
                  </p>
                )}
              </div>
            )}
          </section>
          <section className="flex min-h-0 min-w-0 flex-col border-r border-border-subtle bg-surface-subtle p-2">
            <div className="grid min-h-0 flex-1 place-items-center overflow-hidden [container-type:inline-size]">
              <div className="aspect-[210/297] h-[min(100%,141.428cqw)] max-w-full">
                {previewHtml ? (
                  <SelectableTemplatePreview
                    html={previewHtml}
                    disabled={locked || published}
                    selected={selectedTarget}
                    onSelect={selectTarget}
                    title={`${displayName || '템플릿'} 미리보기`}
                  />
                ) : (
                  <TemplatePreviewEmptyState />
                )}
              </div>
            </div>
          </section>
          <section className="flex min-h-0 min-w-0 flex-col gap-4 bg-bg-surface p-4">
            <div className="flex flex-wrap justify-end gap-2">
              <Button variant="secondary" disabled={locked} onClick={onBack}>
                목록으로
              </Button>
              {!published && (
                <Button
                  disabled={
                    locked || !editor.template || versionNumber === undefined
                  }
                  onClick={() => setSaveModalOpen(true)}
                >
                  저장
                </Button>
              )}
            </div>
            {previewHtml ? (
              <TemplateHtmlCode
                html={previewHtml}
                disabled={locked || published}
                selected={selectedTarget}
                onSelect={selectTarget}
              />
            ) : (
              <div className="flex min-h-0 flex-1 items-center justify-center rounded-md border border-border-subtle bg-surface-subtle p-4 text-center text-body-sm-web text-text-secondary">
                템플릿을 생성하면 HTML이 표시됩니다.
              </div>
            )}
            {previewHtml && !published && (
              <p className="text-caption-web text-text-secondary">
                미리보기 요소를 클릭하거나 HTML 코드를 선택해 수정할 부분을
                지정하세요.
              </p>
            )}
          </section>
        </div>
      </ScrollArea>

      <AdminModal
        title="템플릿 저장"
        open={saveModalOpen}
        onClose={() => {
          if (!editor.busy) setSaveModalOpen(false);
        }}
      >
        <div className="flex flex-col gap-6">
          <p className="text-body-sm-web text-text-secondary">
            {versionNumber}번 버전을 최종 저장하시겠습니까? 저장하면 해당
            버전으로 게시되며 모든 임시저장 버전이 삭제됩니다. 이후에는 수정할
            수 없습니다. 점주 노출 여부는 목록에서 설정할 수 있습니다.
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
              onClick={() => setSaveModalOpen(false)}
            >
              취소
            </Button>
            <Button disabled={editor.busy} onClick={() => void handleSave()}>
              {editor.busy ? '저장 중' : '저장'}
            </Button>
          </div>
        </div>
      </AdminModal>
      <AdminModal
        title="버전 이동"
        open={pendingVersion !== null}
        onClose={() => setPendingVersion(null)}
      >
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <p className="text-body-sm-web text-text-primary">
              {pendingVersion}번 버전으로 돌아가시겠습니까?
            </p>
            <p className="text-body-sm-web text-text-secondary">
              선택한 버전의 HTML과 미리보기를 표시합니다.
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setPendingVersion(null)}>
              취소
            </Button>
            <Button disabled={locked} onClick={confirmVersionChange}>
              돌아가기
            </Button>
          </div>
        </div>
      </AdminModal>
    </section>
  );
};
