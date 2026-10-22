import '../templateEditor.css';

import { useState } from 'react';
import { Button } from '@repo/ui';

import { AdminModal } from '@admin/ui/AdminModal/AdminModal';
import { ScrollArea } from '@admin/ui/ScrollArea/ScrollArea';

import { useTemplateChat } from '../useTemplateChat';
import { SelectableTemplatePreview } from './SelectableTemplatePreview';
import { TemplateChatPanel } from './TemplateChatPanel';
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
    <section className="template-editor flex h-full min-h-0 min-w-0 flex-col">
      <ScrollArea
        aria-label="템플릿 편집 영역"
        orientation="horizontal"
        hideScrollbar
        tabIndex={0}
        className="template-editor__frame min-w-0 rounded-xl border shadow-sm focus-visible:outline-2 focus-visible:outline-action-primary"
      >
        {/* 세 영역을 함께 보며 편집할 수 있도록 최소 작업 너비 아래에서만 가로로 스크롤한다. */}
        <div className="grid h-full min-h-0 min-w-[800px] grid-cols-[minmax(240px,0.8fr)_minmax(240px,1fr)_minmax(300px,1.2fr)]">
          <TemplateChatPanel chat={chat} />
          <section className="template-editor__canvas flex min-h-0 min-w-0 flex-col border-r p-3">
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
          <section className="template-editor__panel flex min-h-0 min-w-0 flex-col gap-4 p-4">
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
              <div className="template-editor__code flex min-h-0 flex-1 items-center justify-center rounded-xl border p-4 text-center text-body-sm-web">
                템플릿을 생성하면 HTML이 표시됩니다.
              </div>
            )}
            {previewHtml && !published && (
              <p className="template-editor__hint text-caption-web">
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
