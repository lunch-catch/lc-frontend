import { Button, StatusBadge } from '@repo/ui';
import { Code2, MousePointer2, Send, Square, X } from 'lucide-react';

import type { TemplateChatState } from '../useTemplateChat';

interface TemplateChatComposerProps {
  chat: TemplateChatState;
  onViewList: () => void;
}

export const TemplateChatComposer = ({
  chat,
  onViewList,
}: TemplateChatComposerProps) => {
  const {
    editor,
    prompt,
    locked,
    isViewingPreviousVersion,
    selectedTarget,
    handleSend,
    promptRef,
    clearSelection,
    changePrompt,
    displayName,
    selectionError,
    isResponding,
    stopResponse,
  } = chat;

  const showSuggestions =
    !isViewingPreviousVersion &&
    !prompt.trim() &&
    editor.suggestedPrompts.length > 0;

  return (
    <>
      {showSuggestions ? (
        <div
          className="flex shrink-0 flex-wrap gap-2 px-4 pb-1 pt-2"
          aria-label="추천 수정 요청"
        >
          {editor.suggestedPrompts.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              disabled={locked}
              className="template-editor__suggestion rounded-full border px-3 py-1.5 text-caption-web transition-colors focus-visible:outline-2 focus-visible:outline-action-primary disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() => void handleSend(suggestion)}
            >
              {suggestion}
            </button>
          ))}
        </div>
      ) : null}
      <div
        aria-busy={editor.busy}
        className="template-editor__composer flex shrink-0 flex-col gap-3 px-4 pb-4 pt-2"
      >
        {editor.isWaiting && (
          <p role="status" className="template-editor__hint text-caption-web">
            {editor.retryAfterSeconds}초 후 같은 요청을 다시 보낼 수 있습니다.
          </p>
        )}
        {isViewingPreviousVersion && (
          <p
            id="template-version-notice"
            className="text-caption-web text-text-secondary"
          >
            이전 버전은 확인하거나 저장·게시할 수 있습니다. 채팅 수정은 최신
            버전에서만 가능합니다.
          </p>
        )}
        <label htmlFor="template-request" className="sr-only">
          템플릿 생성·수정 요청
        </label>
        <div
          data-has-selection={selectedTarget !== null}
          className="template-editor__input relative flex flex-col rounded-2xl border transition-colors"
        >
          {selectedTarget && (
            <StatusBadge
              variant="neutral"
              className="template-editor__target ml-3 mt-2 h-6 max-w-[calc(100%-1.5rem)] gap-1.5 self-start border"
              style={{
                paddingBlock: 0,
                paddingInline: 'var(--space-2)',
                backgroundColor: 'var(--editor-target-bg)',
                color: 'var(--editor-target-fg)',
                borderColor: 'var(--editor-target-border)',
              }}
            >
              {selectedTarget.source === 'code' ? (
                <Code2 aria-hidden="true" className="size-3 shrink-0" />
              ) : (
                <MousePointer2 aria-hidden="true" className="size-3 shrink-0" />
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
                onClick={clearSelection}
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
              isViewingPreviousVersion
                ? 'template-version-notice'
                : selectedTarget
                  ? 'template-selection-label'
                  : undefined
            }
            maxLength={500}
            // 전송 중 포커스와 이전 버전에서 작성한 입력을 보존하되 수정·전송은 막는다.
            readOnly={locked || isViewingPreviousVersion}
            value={prompt}
            onChange={(event) => changePrompt(event.target.value)}
            placeholder={
              isViewingPreviousVersion
                ? '채팅 수정은 최신 버전으로 이동한 뒤 요청해 주세요'
                : selectedTarget
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
            aria-label={
              isResponding
                ? editor.requestPending
                  ? '응답 대기 중단'
                  : '답변 전체 표시'
                : '생성·수정 요청 보내기'
            }
            title={
              isResponding
                ? editor.requestPending
                  ? '응답 대기 중단 (서버 생성은 계속될 수 있습니다)'
                  : '답변 전체 표시'
                : '보내기'
            }
            className="absolute bottom-3 right-3 flex size-8 items-center justify-center rounded-lg bg-action-primary text-white transition-colors enabled:hover:bg-action-primary-hover disabled:cursor-not-allowed disabled:bg-surface-subtle disabled:text-text-disabled focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary"
            disabled={
              !isResponding &&
              (locked ||
                isViewingPreviousVersion ||
                !displayName.trim() ||
                !prompt.trim())
            }
            onClick={() => (isResponding ? stopResponse() : void handleSend())}
          >
            {isResponding ? (
              <Square aria-hidden="true" className="size-3.5 fill-current" />
            ) : (
              <Send aria-hidden="true" className="size-4" />
            )}
          </button>
        </div>
        {editor.stopNotice && (
          <div
            role="status"
            className="space-y-2 text-caption-web text-text-secondary"
          >
            <p>{editor.stopNotice}</p>
            <div className="flex flex-wrap gap-2">
              {editor.canRecheck && (
                <Button
                  variant="neutral"
                  disabled={locked}
                  onClick={() => void editor.recheckSaved()}
                >
                  저장 결과 다시 확인
                </Button>
              )}
              <Button variant="tertiary" disabled={locked} onClick={onViewList}>
                목록에서 확인
              </Button>
            </div>
          </div>
        )}
        {selectionError && (
          <p role="alert" className="text-caption-web text-status-danger-fg">
            {selectionError}
          </p>
        )}
      </div>
    </>
  );
};
