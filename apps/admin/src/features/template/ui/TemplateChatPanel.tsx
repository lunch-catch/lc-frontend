import { Fragment } from 'react';
import { Button } from '@repo/ui';

import { ScrollArea } from '@admin/ui/ScrollArea/ScrollArea';

import type { TemplateChatState } from '../useTemplateChat';
import { TemplateChatBubble } from './TemplateChatBubble';
import { TemplateChatComposer } from './TemplateChatComposer';
import { TemplateVersionMessage } from './TemplateVersionMessage';

interface TemplateChatPanelProps {
  chat: TemplateChatState;
}

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

  return (
    <section className="template-editor__chat flex min-h-0 min-w-0 flex-col border-r">
      <ScrollArea className="flex flex-col gap-4 p-4" ref={chatHistoryRef}>
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
            {version.requestPrompt.trim() && (
              <TemplateChatBubble variant="user">
                {version.requestPrompt}
              </TemplateChatBubble>
            )}
            {version.message.trim() && (
              <TemplateChatBubble
                variant="assistant"
                className="whitespace-pre-wrap"
              >
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
          <Fragment key={message.versionNumber}>
            <TemplateChatBubble variant="user">
              {message.targetLabel && (
                <span className="template-editor__hint mb-1 block text-caption-web">
                  수정 대상 · {message.targetLabel}
                </span>
              )}
              {message.text}
            </TemplateChatBubble>
            {/* LLM 설명은 검증되지 않은 텍스트이므로 HTML로 해석하지 않는다. */}
            {message.assistantMessage.trim() && (
              <TemplateChatBubble
                variant="assistant"
                className="whitespace-pre-wrap"
              >
                {message.assistantMessage}
              </TemplateChatBubble>
            )}
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
              <span className="template-editor__hint mb-1 block text-caption-web">
                수정 대상 · {pendingMessage.targetLabel}
              </span>
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
