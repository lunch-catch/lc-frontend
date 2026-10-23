import { Fragment } from 'react';
import { Button, StatusBadge } from '@repo/ui';
import { ArrowUpRight, MessageSquareText, MousePointer2 } from 'lucide-react';

import { ScrollArea } from '@admin/ui/ScrollArea/ScrollArea';

import type { TemplateChatState } from '../useTemplateChat';
import { TemplateChatBubble } from './TemplateChatBubble';
import { TemplateChatComposer } from './TemplateChatComposer';
import { TemplateChatReveal } from './TemplateChatReveal';
import { TemplateVersionMessage } from './TemplateVersionMessage';

interface TemplateChatPanelProps {
  chat: TemplateChatState;
}

/** 전송 대기 중과 완료된 말풍선에서 같은 선택 태그를 표시한다. */
const TemplateMessageTarget = ({ label }: { label: string }) => (
  <div className="mb-2 min-w-0">
    <StatusBadge
      variant="neutral"
      className="template-editor__target h-6 max-w-full gap-1.5 border"
      style={{
        paddingBlock: 0,
        paddingInline: 'var(--space-2)',
        backgroundColor: 'var(--editor-target-bg)',
        color: 'var(--editor-target-fg)',
        borderColor: 'var(--editor-target-border)',
      }}
    >
      <MousePointer2 aria-hidden="true" className="size-3 shrink-0" />
      <span className="min-w-0 truncate" title={label}>
        <span className="sr-only">수정 대상: </span>
        {label}
      </span>
    </StatusBadge>
  </div>
);

export const TemplateChatPanel = ({ chat }: TemplateChatPanelProps) => {
  const {
    editor,
    published,
    locked,
    previousVersions,
    messages,
    pendingMessage,
    versionNumber,
    requestVersionChange,
    chatHistoryRef,
  } = chat;

  const followLatestMessage = () => {
    const history = chatHistoryRef.current;
    if (!history) return;
    // 하단 근처에서만 새 답변을 따라가고, 이전 대화를 읽는 중에는 위치를 유지한다.
    const distanceFromBottom =
      history.scrollHeight - history.scrollTop - history.clientHeight;
    if (distanceFromBottom < 96)
      history.scrollTo({ top: history.scrollHeight });
  };

  return (
    <section className="template-editor__chat flex min-h-0 min-w-0 flex-col border-r">
      <header className="template-editor__panel-heading flex shrink-0 items-center gap-2 border-b p-4">
        <MessageSquareText
          aria-hidden="true"
          className="size-4 text-text-secondary"
        />
        <h2
          className="min-w-0 truncate text-body-sm-web font-semibold"
          title={chat.displayName}
        >
          {chat.displayName}
        </h2>
      </header>
      <ScrollArea
        className="flex flex-col gap-5 px-5 py-4"
        ref={chatHistoryRef}
      >
        {!published &&
          previousVersions.length === 0 &&
          messages.length === 0 &&
          !pendingMessage && (
            <div className="flex flex-col items-start py-4">
              <h3 className="text-xl font-semibold leading-snug tracking-tight">
                어떤 포스터를
                <br />
                만들어 볼까요?
              </h3>
              <p className="mt-2 text-body-sm-web leading-6 text-text-secondary">
                원하는 분위기와 색상을 알려주세요.
                <br />
                대화하며 조금씩 다듬을 수 있어요.
              </p>
              <div
                className="mt-5 flex w-full flex-col gap-2"
                aria-label="시작 문구 예시"
              >
                {[
                  '따뜻한 주황색의 점심 할인 포스터를 만들어줘',
                  '깔끔한 흰색 배경에 메뉴가 돋보이게 만들어줘',
                ].map((example) => (
                  <button
                    key={example}
                    type="button"
                    disabled={locked}
                    className="template-editor__starter flex items-center justify-between gap-3 rounded-xl border p-3 text-left text-caption-web leading-5 transition-colors focus-visible:outline-2 focus-visible:outline-action-primary"
                    onClick={() => {
                      chat.changePrompt(example);
                      chat.promptRef.current?.focus();
                    }}
                  >
                    {example}
                    <ArrowUpRight
                      aria-hidden="true"
                      className="size-4 shrink-0"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
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
        {/* 버전 이력의 요청·설명을 복원하되 이번 대화에 있는 버전은 훅에서 제외한다. */}
        {previousVersions.map((version) => (
          <Fragment key={version.versionNumber}>
            {version.text.trim() && (
              <TemplateChatBubble variant="user">
                {version.targetLabel && (
                  <TemplateMessageTarget label={version.targetLabel} />
                )}
                {version.text}
              </TemplateChatBubble>
            )}
            {version.message.trim() && (
              <TemplateChatBubble variant="assistant">
                {version.message}
              </TemplateChatBubble>
            )}
            <TemplateVersionMessage
              versionNumber={version.versionNumber}
              current={version.versionNumber === versionNumber}
              disabled={locked}
              availability={editor.getVersionAvailability(
                version.versionNumber,
              )}
              onSelect={requestVersionChange}
            />
          </Fragment>
        ))}
        {messages.map((message) => (
          <Fragment key={message.id}>
            <TemplateChatBubble variant="user">
              {message.targetLabel && (
                <TemplateMessageTarget label={message.targetLabel} />
              )}
              {message.text}
            </TemplateChatBubble>
            {/* AI 답변과 저장된 이력은 같은 마크다운 말풍선을 사용한다. */}
            {message.assistantMessage.trim() && (
              <TemplateChatBubble variant="assistant">
                <TemplateChatReveal
                  text={message.assistantMessage}
                  onProgress={followLatestMessage}
                />
              </TemplateChatBubble>
            )}
            {message.versionNumber !== null && (
              <TemplateVersionMessage
                versionNumber={message.versionNumber}
                current={message.versionNumber === versionNumber}
                disabled={locked}
                availability={editor.getVersionAvailability(
                  message.versionNumber,
                )}
                onSelect={requestVersionChange}
              />
            )}
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
              <TemplateMessageTarget label={pendingMessage.targetLabel} />
            )}
            {pendingMessage.text}
          </TemplateChatBubble>
        )}
        {editor.busy && <TemplateChatBubble variant="loading" />}
        {editor.error && (
          <p role="alert" className="text-body-sm-web text-status-danger-fg">
            {editor.error}
          </p>
        )}
      </ScrollArea>
      {!published && <TemplateChatComposer chat={chat} />}
    </section>
  );
};
