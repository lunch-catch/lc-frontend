import { useEffect, useRef, useState } from 'react';
import { Button, Input } from '@repo/ui';
import { ArrowLeft, Send, X } from 'lucide-react';

import { AdminModal } from '@admin/components/AdminModal/AdminModal';
import { QuickPromptButton } from '@admin/components/QuickPromptButton/QuickPromptButton';
import { ScrollArea } from '@admin/components/ScrollArea/ScrollArea';
import { TemplateChatBubble } from '@admin/components/TemplateChatBubble/TemplateChatBubble';
import { TemplatePreviewEmptyState } from '@admin/components/TemplatePreviewEmptyState/TemplatePreviewEmptyState';
import {
  getTemplatePreviewHtml,
  posterPreviewThemes,
  type PosterTemplate,
} from '@admin/features/template/templateData';

interface TemplateCreatePageProps {
  draftTemplate: PosterTemplate | null;
  onBack: () => void;
  onSave: (template: PosterTemplate) => void;
  onTemporarySave: (template: PosterTemplate) => void;
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
const minPromptHeight = 48;
const maxPromptHeight = 80;
const assistantResponseDelay = 700;

export const TemplateCreatePage = ({
  draftTemplate,
  onBack,
  onSave,
  onTemporarySave,
}: TemplateCreatePageProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      isAssistant: true,
      text: '만들고 싶은 포스터의 분위기와 홍보 내용을 알려주세요. 색상과 문구를 반영한 템플릿 초안을 만들게요.',
    },
  ]);
  const [prompt, setPrompt] = useState('');
  const [hasPreview, setHasPreview] = useState(draftTemplate !== null);
  const [isResponding, setIsResponding] = useState(false);
  const [exitModalOpen, setExitModalOpen] = useState(false);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [temporarySaveModalOpen, setTemporarySaveModalOpen] = useState(false);
  const [saveName, setSaveName] = useState(draftTemplate?.name ?? '새 템플릿');
  const [themeIndex, setThemeIndex] = useState(0);
  const [selectedThemeIndexes, setSelectedThemeIndexes] = useState([0, 1, 2]);
  const chatHistoryRef = useRef<HTMLDivElement>(null);
  const promptRef = useRef<HTMLTextAreaElement>(null);
  const responseTimeoutRef = useRef<number | null>(null);

  const previewTemplate: PosterTemplate = {
    createdAt: '2026-10-02 10:00',
    id: 'TPL-0003',
    isActive: false,
    name: saveName.trim() || '새 템플릿',
    status: 'PUBLISHED',
    updatedAt: '2026-10-02 10:00',
    updatedBy: 'ADM-001',
    usageCount: 0,
  };

  const handleSend = (nextPrompt = prompt) => {
    const trimmedPrompt = nextPrompt.trim();
    if (!trimmedPrompt || isResponding) return;

    setMessages((current) => [
      ...current,
      { id: Date.now(), isAssistant: false, text: trimmedPrompt },
    ]);
    setPrompt('');
    setHasPreview(true);
    setIsResponding(true);

    responseTimeoutRef.current = window.setTimeout(() => {
      setMessages((current) => [
        ...current,
        {
          id: Date.now(),
          isAssistant: true,
          text: '요청 내용을 반영해 미리보기를 업데이트했어요. 문구나 색상을 더 바꾸고 싶다면 이어서 요청해 주세요.',
        },
      ]);
      responseTimeoutRef.current = null;
      setIsResponding(false);
    }, assistantResponseDelay);
  };

  const handleSave = () => {
    const templateName = saveName.trim();
    if (!templateName) return;

    onSave({
      ...previewTemplate,
      id: 'TPL-NEW',
      name: templateName,
      updatedAt: '2026-10-02 10:00',
    });
  };

  const handleTemporarySave = () => {
    onTemporarySave({
      ...previewTemplate,
      id: 'TPL-NEW',
      name: saveName.trim() || previewTemplate.name,
      status: 'DRAFT',
      updatedAt: '2026-10-02 10:00',
    });
  };

  const handleThemeRemove = (index: number) => {
    const next = selectedThemeIndexes.filter((item) => item !== index);
    setSelectedThemeIndexes(next);
    if (themeIndex === index) setThemeIndex(next[0] ?? 0);
  };

  const handleThemeSelect = (index: number) => {
    if (selectedThemeIndexes.includes(index)) {
      setThemeIndex(index);
      return;
    }

    if (selectedThemeIndexes.length < 3) {
      setSelectedThemeIndexes((current) => [...current, index]);
      setThemeIndex(index);
    }
  };

  const resizePrompt = (textarea: HTMLTextAreaElement) => {
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.max(
      minPromptHeight,
      Math.min(textarea.scrollHeight, maxPromptHeight),
    )}px`;
    textarea.style.overflowY =
      textarea.scrollHeight > maxPromptHeight ? 'auto' : 'hidden';
  };

  useEffect(() => {
    const textarea = promptRef.current;
    if (!textarea) return;

    resizePrompt(textarea);
  }, [prompt]);

  useEffect(() => {
    const chatHistory = chatHistoryRef.current;
    if (!chatHistory) return;

    chatHistory.scrollTo({ top: chatHistory.scrollHeight });
  }, [isResponding, messages]);

  useEffect(
    () => () => {
      if (responseTimeoutRef.current) {
        window.clearTimeout(responseTimeoutRef.current);
      }
    },
    [],
  );

  return (
    <section className="flex h-full min-h-0 flex-col">
      <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden rounded-xl border border-border-subtle shadow-sm xl:grid-cols-[minmax(380px,440px)_minmax(320px,1fr)_minmax(280px,320px)]">
        <section className="relative flex min-h-0 flex-col border-b border-border-subtle xl:border-b-0 xl:border-r">
          <div className="absolute inset-x-0 top-0 z-20 flex items-center bg-gradient-to-b from-bg-page via-bg-page/80 to-transparent px-3 pb-10 pt-2">
            <Button
              className="!min-h-8 !px-1 text-caption-web"
              leadingIcon={<ArrowLeft aria-hidden="true" className="size-4" />}
              onClick={() => setExitModalOpen(true)}
              variant="tertiary"
            >
              목록으로 돌아가기
            </Button>
          </div>
          <ScrollArea
            className="flex flex-col gap-4 bg-bg-page px-4 pb-36 pt-14"
            ref={chatHistoryRef}
          >
            {messages.map((message) => (
              <TemplateChatBubble
                key={message.id}
                variant={message.isAssistant ? 'assistant' : 'user'}
              >
                {message.text}
              </TemplateChatBubble>
            ))}
            {isResponding && <TemplateChatBubble variant="loading" />}
          </ScrollArea>
          <div className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-b from-transparent via-bg-page/80 to-bg-page px-4 pb-4 pt-8">
            <label className="sr-only" htmlFor="template-request">
              템플릿 생성 요청
            </label>
            <div className="relative">
              <div className="absolute bottom-[calc(100%+var(--space-2))] left-0 z-10 flex flex-col items-start gap-1.5 bg-transparent">
                {suggestions.map((suggestion) => (
                  <QuickPromptButton
                    disabled={isResponding}
                    key={suggestion}
                    label={suggestion}
                    onClick={() => handleSend(suggestion)}
                  />
                ))}
              </div>
              <textarea
                className="h-12 max-h-20 w-full resize-none rounded-md border border-border-subtle bg-bg-surface px-3 py-2 pr-12 text-body-sm-web leading-5 text-text-primary placeholder:text-text-secondary focus:border-action-primary focus:outline-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                id="template-request"
                disabled={isResponding}
                onChange={(event) => {
                  resizePrompt(event.currentTarget);
                  setPrompt(event.target.value);
                }}
                onKeyDown={(event) => {
                  if (
                    event.key !== 'Enter' ||
                    event.shiftKey ||
                    event.nativeEvent.isComposing
                  ) {
                    return;
                  }

                  event.preventDefault();
                  handleSend();
                }}
                ref={promptRef}
                rows={1}
                value={prompt}
              />
              <button
                aria-label="메시지 보내기"
                className="absolute inset-y-0 right-2 my-auto flex size-8 -translate-y-px items-center justify-center rounded-md !bg-transparent text-text-secondary transition-colors hover:!bg-transparent hover:text-action-primary focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-action-primary disabled:!bg-transparent disabled:cursor-not-allowed disabled:text-text-disabled"
                disabled={!prompt.trim() || isResponding}
                onClick={() => handleSend()}
                type="button"
              >
                <Send aria-hidden="true" className="size-4" />
              </button>
            </div>
          </div>
        </section>

        <section className="flex min-h-0 flex-col border-b border-border-subtle bg-surface-subtle p-3 xl:border-b-0">
          <div className="grid min-h-0 flex-1 place-items-center overflow-hidden [container-type:inline-size]">
            <div className="aspect-[210/297] h-[min(100%,141.428cqw)] max-w-full">
              {hasPreview ? (
                <iframe
                  className="size-full rounded-lg border border-border-subtle bg-bg-page shadow-md"
                  sandbox=""
                  srcDoc={getTemplatePreviewHtml(previewTemplate, themeIndex)}
                  title="새 템플릿 미리보기"
                />
              ) : (
                <TemplatePreviewEmptyState />
              )}
            </div>
          </div>
        </section>

        <section className="flex min-h-0 flex-col bg-bg-surface p-4">
          <div className="flex items-center justify-end pb-2 text-caption-web font-semibold text-text-primary">
            {selectedThemeIndexes.length} / 3
          </div>
          <div className="flex flex-col gap-2">
            {selectedThemeIndexes.map((index, order) => {
              const theme = posterPreviewThemes[index];
              const isPreviewed = index === themeIndex;

              return (
                <div
                  className={`flex items-center gap-3 rounded-md border p-2 transition-colors ${isPreviewed ? 'border-action-primary bg-status-info-bg' : 'border-transparent bg-surface-subtle'}`}
                  key={theme.label}
                >
                  <button
                    aria-label={`${theme.label} 테마 미리보기`}
                    className="flex min-w-0 flex-1 items-center gap-3 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary"
                    onClick={() => setThemeIndex(index)}
                    type="button"
                  >
                    <span
                      aria-hidden="true"
                      className="grid h-11 w-12 shrink-0 grid-rows-[1fr_10px] overflow-hidden border border-border-subtle"
                      style={{ backgroundColor: theme.background }}
                    >
                      <span
                        className="px-1 pt-1 text-body-sm-web font-semibold"
                        style={{ color: theme.ink }}
                      >
                        가
                      </span>
                      <span style={{ backgroundColor: theme.accent }} />
                    </span>
                    <span className="min-w-0 truncate text-body-sm-web font-semibold text-text-primary">
                      {order + 1}. {theme.label}
                    </span>
                  </button>
                  <button
                    aria-label={`${theme.label} 테마 제거`}
                    className="flex size-8 shrink-0 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-bg-surface hover:text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary"
                    onClick={() => handleThemeRemove(index)}
                    type="button"
                  >
                    <X aria-hidden="true" className="size-4" />
                  </button>
                </div>
              );
            })}
          </div>
          <div className="mt-5 border-b border-border-subtle pb-2 text-caption-web font-medium text-text-secondary">
            테마 라이브러리
          </div>
          <ScrollArea className="flex flex-col">
            {posterPreviewThemes.map((theme, index) => {
              const isApplied = selectedThemeIndexes.includes(index);
              const isDisabled =
                !isApplied && selectedThemeIndexes.length === 3;

              return (
                <button
                  aria-pressed={isApplied}
                  className="flex min-h-12 items-center gap-3 border-b border-border-subtle px-1 text-left transition-colors hover:bg-surface-subtle disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-action-primary"
                  disabled={isDisabled}
                  key={theme.label}
                  onClick={() => handleThemeSelect(index)}
                  type="button"
                >
                  <span
                    aria-hidden="true"
                    className="grid h-6 w-[72px] shrink-0 grid-cols-3 overflow-hidden border border-border-subtle"
                  >
                    <span style={{ backgroundColor: theme.background }} />
                    <span style={{ backgroundColor: theme.ink }} />
                    <span style={{ backgroundColor: theme.accent }} />
                  </span>
                  <span className="min-w-0 flex-1 truncate text-body-sm-web font-medium text-text-primary">
                    {theme.label}
                  </span>
                  {isApplied && (
                    <span className="text-caption-web font-semibold text-action-primary">
                      적용됨
                    </span>
                  )}
                </button>
              );
            })}
          </ScrollArea>
          <div className="mt-auto flex justify-end gap-2 pt-4">
            <Button
              className="!min-h-9"
              onClick={() => setTemporarySaveModalOpen(true)}
              variant="secondary"
            >
              임시저장
            </Button>
            <Button className="!min-h-9" onClick={() => setSaveModalOpen(true)}>
              저장
            </Button>
          </div>
        </section>
      </div>

      <AdminModal
        onClose={() => setExitModalOpen(false)}
        open={exitModalOpen}
        title="작성을 그만두시겠어요?"
      >
        <div className="flex flex-col gap-6">
          <p className="text-body-sm-web leading-6 text-text-secondary">
            저장하지 않은 템플릿 내용은 사라집니다. 그래도 목록으로
            돌아가시겠어요?
          </p>
          <div className="flex justify-end gap-2">
            <Button onClick={onBack} variant="neutral">
              나가기
            </Button>
            <Button onClick={() => setExitModalOpen(false)}>계속 작성</Button>
          </div>
        </div>
      </AdminModal>

      <AdminModal
        onClose={() => setSaveModalOpen(false)}
        open={saveModalOpen}
        title="템플릿 등록"
      >
        <div className="flex flex-col gap-6">
          <p className="text-body-sm-web leading-6 text-text-secondary">
            템플릿명을 확인한 뒤 등록하세요. 등록한 템플릿은 게시 전까지
            점주에게 노출되지 않습니다.
          </p>
          <Input
            autoFocus
            label="템플릿명"
            onChange={(event) => setSaveName(event.target.value)}
            placeholder="템플릿명을 입력해 주세요"
            value={saveName}
          />
          <div className="flex justify-end gap-2">
            <Button onClick={() => setSaveModalOpen(false)} variant="secondary">
              취소
            </Button>
            <Button disabled={!saveName.trim()} onClick={handleSave}>
              등록
            </Button>
          </div>
        </div>
      </AdminModal>

      <AdminModal
        onClose={() => setTemporarySaveModalOpen(false)}
        open={temporarySaveModalOpen}
        title="임시저장"
      >
        <div className="flex flex-col gap-6">
          <p className="text-body-sm-web leading-6 text-text-secondary">
            현재 작성 중인 템플릿을 임시저장하시겠습니까? 임시저장한 템플릿은
            게시 전까지 점주에게 노출되지 않습니다.
          </p>
          <div className="flex justify-end gap-2">
            <Button
              onClick={() => setTemporarySaveModalOpen(false)}
              variant="secondary"
            >
              계속 작성
            </Button>
            <Button onClick={handleTemporarySave}>임시저장</Button>
          </div>
        </div>
      </AdminModal>
    </section>
  );
};
