import '../templateEditor.css';

import { useState } from 'react';
import { Button, Toggle } from '@repo/ui';
import { ArrowLeft, Braces } from 'lucide-react';

import { AdminModal } from '@admin/ui/AdminModal/AdminModal';
import { ScrollArea } from '@admin/ui/ScrollArea/ScrollArea';

import { useTemplateChat } from '../useTemplateChat';
import { SelectableTemplatePreview } from './SelectableTemplatePreview';
import { TemplateChatPanel } from './TemplateChatPanel';
import { TemplateEditorPanels } from './TemplateEditorPanels';
import { TemplateHtmlCode } from './TemplateHtmlCode';
import { TemplateNameModal } from './TemplateNameModal';
import { TemplatePreviewEmptyState } from './TemplatePreviewEmptyState';

export interface TemplateCreateContentProps {
  templateId?: string;
  initialName?: string;
  onBack: () => void;
  onPublished: () => void;
  onCreated: (id: number) => void;
}

export const TemplateCreateContent = ({
  templateId,
  initialName,
  onBack,
  onPublished,
  onCreated,
}: TemplateCreateContentProps) => {
  const chat = useTemplateChat({ templateId, initialName, onCreated });
  const {
    editor,
    name,
    setName,
    published,
    locked,
    versionNumber,
    previewHtml,
    displayName,
    selectedTarget,
    selectTarget,
    pendingVersion,
    setPendingVersion,
    confirmVersionChange,
  } = chat;
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [wrapCode, setWrapCode] = useState(false);

  const handleSave = async () => {
    if (versionNumber === undefined) return;
    // 첫 게시와 재게시 모두 서버에 남아 있는 선택 버전의 번호로 확정한다.
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
    <section className="template-editor flex h-full min-h-0 min-w-0 flex-col">
      <ScrollArea
        aria-label="템플릿 편집 영역"
        orientation="horizontal"
        hideScrollbar
        tabIndex={0}
        className="template-editor__frame min-w-0 rounded-xl border shadow-sm focus-visible:outline-2 focus-visible:outline-action-primary"
      >
        {/* 세 영역을 함께 보며 편집할 수 있도록 최소 작업 너비 아래에서만 가로로 스크롤한다. */}
        <TemplateEditorPanels>
          <TemplateChatPanel
            chat={chat}
            onViewList={onBack}
            onRename={() => setRenameModalOpen(true)}
          />
          <section className="template-editor__canvas flex min-h-0 min-w-0 flex-col p-4">
            <div className="flex min-h-0 flex-1">
              {previewHtml ? (
                <SelectableTemplatePreview
                  html={previewHtml}
                  disabled={locked}
                  selected={selectedTarget}
                  onSelect={selectTarget}
                  title={`${displayName || '템플릿'} 미리보기`}
                />
              ) : (
                <div className="grid min-h-0 flex-1 place-items-center">
                  <TemplatePreviewEmptyState />
                </div>
              )}
            </div>
          </section>
          <section className="template-editor__panel flex min-h-0 min-w-0 flex-col gap-4 p-4">
            <header className="template-editor__panel-heading flex shrink-0 flex-wrap items-center justify-between gap-2 border-b pb-3">
              <Toggle
                label="자동 줄바꿈"
                checked={wrapCode}
                onChange={(event) => setWrapCode(event.target.checked)}
                className="cursor-pointer whitespace-nowrap has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-4 has-[:focus-visible]:outline-action-primary"
              />
              <div className="ml-auto flex shrink-0 items-center gap-2">
                {/* aria-disabled는 색상을 유지하므로 클릭 핸들러에서도 전송 중 동작을 차단한다. */}
                <Button
                  variant="secondary"
                  leadingIcon={
                    <ArrowLeft aria-hidden="true" className="size-4" />
                  }
                  aria-disabled={locked || undefined}
                  className={
                    '!min-h-8 !px-3 !py-1 text-caption-web' +
                    (locked ? ' cursor-wait' : '')
                  }
                  onClick={() => {
                    if (!locked) onBack();
                  }}
                >
                  목록으로
                </Button>
                <Button
                  disabled={!editor.template || versionNumber === undefined}
                  aria-disabled={locked || undefined}
                  className={
                    '!min-h-8 !px-3 !py-1 text-caption-web' +
                    (locked ? ' cursor-wait' : '')
                  }
                  onClick={() => {
                    if (!locked) setSaveModalOpen(true);
                  }}
                >
                  {published ? '다시 게시' : '저장'}
                </Button>
              </div>
            </header>
            {previewHtml ? (
              <TemplateHtmlCode
                html={previewHtml}
                wrapLines={wrapCode}
                disabled={locked}
                selected={selectedTarget}
                onSelect={selectTarget}
              />
            ) : (
              <div className="template-editor__code flex min-h-0 flex-1 flex-col items-center justify-center gap-3 rounded-xl border border-dashed p-6 text-center text-caption-web">
                <Braces
                  aria-hidden="true"
                  className="size-7 text-text-disabled"
                />
                <span className="text-text-secondary">
                  생성된 포스터의 코드가
                  <br />
                  이곳에 표시됩니다.
                </span>
              </div>
            )}
          </section>
        </TemplateEditorPanels>
      </ScrollArea>

      {renameModalOpen && editor.template && (
        <TemplateNameModal
          initialName={displayName}
          onClose={() => setRenameModalOpen(false)}
          onStart={async (name) => {
            await editor.rename(name);
            setRenameModalOpen(false);
          }}
        />
      )}
      <AdminModal
        title={published ? '템플릿 다시 게시' : '템플릿 저장'}
        open={saveModalOpen}
        onClose={() => {
          if (!editor.busy) setSaveModalOpen(false);
        }}
      >
        <div className="flex flex-col gap-6">
          <p className="text-body-sm-web text-text-secondary">
            {versionNumber}번 버전으로 {published ? '다시 게시' : '게시'}
            하시겠습니까? 게시하면 모든 임시저장 버전과 대화가 정리됩니다.
            {published
              ? ' 점주 노출 상태는 유지되며, 새로 만드는 포스터부터 수정 내용이 반영됩니다. 이미 만든 포스터는 바뀌지 않습니다.'
              : ' 게시 후에도 이름과 HTML을 수정할 수 있습니다. 점주 노출 여부는 목록에서 설정할 수 있습니다.'}
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
            <Button
              disabled={editor.busy || versionNumber === undefined}
              onClick={() => void handleSave()}
            >
              {editor.busy ? '저장 중' : published ? '다시 게시' : '저장'}
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
