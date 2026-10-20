import { StatusBadge } from '@repo/ui';
import { Code2, MousePointer2, Send, X } from 'lucide-react';

import type { TemplateChatState } from '../useTemplateChat';

interface TemplateChatComposerProps {
  chat: TemplateChatState;
}

export const TemplateChatComposer = ({ chat }: TemplateChatComposerProps) => {
  const {
    editor,
    prompt,
    locked,
    versionNumber,
    latestVersionNumber,
    selectedTarget,
    handleSend,
    promptRef,
    clearSelection,
    changePrompt,
    displayName,
    selectionError,
  } = chat;

  return (
    <div
      aria-busy={editor.busy}
      className="template-editor__composer flex flex-col gap-3 border-t p-4"
    >
      {!prompt.trim() && editor.generation?.suggestedPrompts.length ? (
        <div className="flex flex-wrap gap-2" aria-label="추천 수정 요청">
          {editor.generation.suggestedPrompts.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              disabled={locked || versionNumber !== latestVersionNumber}
              className="template-editor__suggestion rounded-full border px-3 py-1.5 text-caption-web transition-colors focus-visible:outline-2 focus-visible:outline-action-primary disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() => void handleSend(suggestion)}
            >
              {suggestion}
            </button>
          ))}
        </div>
      ) : null}
      <label htmlFor="template-request" className="sr-only">
        템플릿 생성·수정 요청
      </label>
      <div
        data-has-selection={selectedTarget !== null}
        className="template-editor__input relative flex flex-col rounded-xl border transition-colors"
      >
        {selectedTarget && (
          <StatusBadge
            variant="neutral"
            className="template-editor__target ml-3 mt-2 h-6 max-w-[calc(100%-1.5rem)] gap-1.5 self-start border"
            style={{
              paddingBlock: 0,
              paddingInline: 'var(--space-2)',
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
            selectedTarget ? 'template-selection-label' : undefined
          }
          maxLength={500}
          disabled={locked}
          value={prompt}
          onChange={(event) => changePrompt(event.target.value)}
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
      {editor.isWaiting && (
        <p role="status" className="template-editor__hint text-caption-web">
          {editor.retryAfterSeconds}초 후 같은 요청을 다시 보낼 수 있습니다.
        </p>
      )}
      {selectionError && (
        <p role="alert" className="text-caption-web text-status-danger-fg">
          {selectionError}
        </p>
      )}
    </div>
  );
};
