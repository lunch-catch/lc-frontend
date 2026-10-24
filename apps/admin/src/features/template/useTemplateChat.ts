import { useEffect, useRef, useState } from 'react';

import {
  buildSelectedTemplatePrompt,
  parseSelectedTemplatePrompt,
  type TemplateSelection,
} from './templateSelection';
import { useTemplateEditor } from './useTemplateEditor';

interface TemplateChatOptions {
  templateId?: string;
  initialName?: string;
  onCreated: (id: number) => void;
}

interface TemplateChatEntry {
  id: string;
  versionNumber: number | null;
  html: string | null;
  text: string;
  assistantMessage: string;
  targetLabel?: string;
  hasRemovedElements: boolean;
}

/** 화면에 표시하는 대화·버전·선택 문맥을 관리하고 서버 요청은 editor에 위임한다. */
export const useTemplateChat = ({
  templateId,
  initialName,
  onCreated,
}: TemplateChatOptions) => {
  const editor = useTemplateEditor(templateId);
  const [name, setName] = useState(initialName ?? '');
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<TemplateChatEntry[]>([]);
  const [activeRevealId, setActiveRevealId] = useState<string | null>(null);
  const [pendingMessage, setPendingMessage] = useState<Pick<
    TemplateChatEntry,
    'text' | 'targetLabel'
  > | null>(null);
  const sendingRef = useRef(false);
  const restorePromptFocus = useRef(false);
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);
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
  const locked =
    editor.busy ||
    editor.isWaiting ||
    editor.loadingMore ||
    pendingMessage !== null;
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
      message.versionNumber !== null &&
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
    .map((item) => ({
      ...item,
      ...parseSelectedTemplatePrompt(item.requestPrompt),
    }))
    .sort((a, b) => a.versionNumber - b.versionNumber);
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

  useEffect(() => {
    if (locked || published || editor.loading || !restorePromptFocus.current)
      return;
    // disabled가 해제된 DOM에 포커스한다. 최초 진입·버전 조회에는 포커스를 빼앗지 않는다.
    const input = promptRef.current;
    if (!input || input.disabled) return;
    input.focus({ preventScroll: true });
    restorePromptFocus.current = false;
  }, [locked, published, editor.loading]);

  const handleSend = async (quickPrompt?: string) => {
    const submittedPrompt = quickPrompt ?? prompt;
    if (sendingRef.current || locked || published || !submittedPrompt.trim())
      return;
    // 실제 요청에 포함한 선택만 보관한다. 퀵응답에는 선택 문맥을 붙이지 않는다.
    const targetLabel =
      quickPrompt === undefined ? selectedTarget?.label : undefined;
    let requestPrompt: string;
    try {
      // 추천 문구는 서버가 준 원문 그대로 보내며, 부분 선택 문맥을 덧붙이지 않는다.
      requestPrompt =
        quickPrompt ??
        buildSelectedTemplatePrompt(submittedPrompt, selectedTarget);
    } catch (cause) {
      setSelectionError(
        cause instanceof Error
          ? cause.message
          : '수정 대상을 다시 선택해 주세요.',
      );
      return;
    }
    setSelectionError('');
    setActiveRevealId(null);
    // 이전 답변의 추천은 한 번 전송하면 소비하고, 다음 응답의 추천만 새로 표시한다.
    editor.dismissSuggestions();
    sendingRef.current = true;
    restorePromptFocus.current = true;
    // 응답 전에 말풍선을 표시하고, 실패하면 원문을 복구해 같은 요청을 재시도할 수 있게 한다.
    setPrompt('');
    // 전송 중에도 선택 표시를 유지해 실패·중단 시 사라졌다 복원되는 깜빡임을 막는다.
    setPendingMessage({
      text: submittedPrompt.trim(),
      targetLabel,
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
      // 자연어 응답을 포함해 성공한 요청의 선택만 해제한다.
      setSelectionContext(null);
      if (generated.status !== null)
        setSelectedVersion(generated.versionNumber);
      const messageId = crypto.randomUUID();
      setActiveRevealId(generated.message.trim() ? messageId : null);
      setMessages((current) => [
        ...current,
        {
          versionNumber: generated.versionNumber,
          id: messageId,
          html: generated.html,
          text: submittedPrompt.trim(),
          assistantMessage: generated.message,
          targetLabel,
          hasRemovedElements: generated.removedElements.length > 0,
        },
      ]);
      if (!templateId && generated.status !== null)
        onCreated(generated.templateId);
    } finally {
      sendingRef.current = false;
      setPendingMessage(null);
    }
  };

  return {
    editor,
    name,
    setName,
    prompt,
    messages,
    pendingMessage,
    published,
    locked,
    latestVersionNumber,
    versionNumber,
    previewHtml,
    displayName,
    selectedTarget,
    selectTarget,
    previousVersions,
    pendingVersion,
    setPendingVersion,
    requestVersionChange,
    confirmVersionChange,
    chatHistoryRef,
    promptRef,
    handleSend,
    activeRevealId,
    finishReveal: (id: string) =>
      setActiveRevealId((current) => (current === id ? null : current)),
    isResponding: editor.requestPending || activeRevealId !== null,
    stopResponse: () => {
      if (editor.requestPending) editor.stopGeneration();
      else {
        setActiveRevealId(null);
        promptRef.current?.focus({ preventScroll: true });
      }
    },
    selectionError,
    changePrompt: (value: string) => {
      setPrompt(value);
      setSelectionError('');
    },
    clearSelection: () => {
      setSelectionContext(null);
      setSelectionError('');
      promptRef.current?.focus();
    },
  };
};

export type TemplateChatState = ReturnType<typeof useTemplateChat>;
