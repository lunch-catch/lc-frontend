import { useId, useRef, useState } from 'react';
import { Button } from '@repo/ui';
import { Plus } from 'lucide-react';

import { AdminModal } from '@admin/ui/AdminModal/AdminModal';

import type { PosterTemplate } from '../templateTypes';
import { getTemplateError, TEMPLATE_LIMIT } from '../templateUtils';
import { TemplateNameModal } from './TemplateNameModal';
import { TemplatePreviewCard } from './TemplatePreviewCard';

export interface TemplateManagementContentProps {
  onCreate: (name: string) => void;
  onOpenTemplate: (template: PosterTemplate) => void;
  changeActive: (template: PosterTemplate) => Promise<void>;
  removeTemplate: (template: PosterTemplate) => Promise<void>;
  loading: boolean;
  error: string | null;
  templates: PosterTemplate[];
}

export const TemplateManagementContent = ({
  onCreate,
  onOpenTemplate,
  changeActive,
  removeTemplate,
  loading,
  error,
  templates,
}: TemplateManagementContentProps) => {
  const [nameModalOpen, setNameModalOpen] = useState(false);
  const [limitTooltipOpen, setLimitTooltipOpen] = useState(false);
  const limitTooltipId = useId();
  // 필터 없는 전체 응답으로 생성 한도를 판단하고, 서버의 최신 등록순을 그대로 표시한다.
  const atTemplateLimit = templates.length >= TEMPLATE_LIMIT;
  const canCreate = !loading && !error && !atTemplateLimit;
  const [activationError, setActivationError] = useState<string | null>(null);
  const [changingActive, setChangingActive] = useState(false);
  // 상태 반영 전의 연속 클릭도 막도록 요청 잠금은 ref로 관리한다.
  const activationLock = useRef(false);
  const [pendingActivationTemplate, setPendingActivationTemplate] =
    useState<PosterTemplate | null>(null);
  const [pendingDeletion, setPendingDeletion] = useState<PosterTemplate | null>(
    null,
  );
  const [deletionError, setDeletionError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deletionNotice, setDeletionNotice] = useState('');
  const deletionLock = useRef(false);

  const closeActivationModal = () => {
    if (!activationLock.current) setPendingActivationTemplate(null);
  };
  const closeDeletionModal = () => {
    if (!deletionLock.current) setPendingDeletion(null);
  };

  const handleConfirmActivation = async () => {
    if (!pendingActivationTemplate || activationLock.current) return;
    activationLock.current = true;
    setChangingActive(true);
    setActivationError(null);
    try {
      await changeActive(pendingActivationTemplate);
      setPendingActivationTemplate(null);
    } catch (cause) {
      setActivationError(getTemplateError(cause));
    } finally {
      activationLock.current = false;
      setChangingActive(false);
    }
  };

  const handleConfirmDeletion = async () => {
    if (
      !pendingDeletion ||
      pendingDeletion.status !== 'DRAFT' ||
      deletionLock.current
    )
      return;
    deletionLock.current = true;
    setDeleting(true);
    setDeletionError(null);
    try {
      await removeTemplate(pendingDeletion);
      setDeletionNotice(`${pendingDeletion.name} 템플릿을 삭제했습니다.`);
      setPendingDeletion(null);
    } catch (cause) {
      setDeletionError(getTemplateError(cause));
    } finally {
      deletionLock.current = false;
      setDeleting(false);
    }
  };
  const isActivating = pendingActivationTemplate?.active === false;

  return (
    <section className="@container flex flex-col">
      <header className="mb-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-display-web font-semibold text-text-primary">
            템플릿 관리
          </h2>
          <p className="mt-2 text-body-sm-web text-text-secondary">
            템플릿을 미리보기로 확인하고 점주 노출 여부를 관리합니다.
          </p>
        </div>
        <span
          role="group"
          aria-label={atTemplateLimit ? '템플릿 생성 제한' : undefined}
          aria-describedby={
            atTemplateLimit && limitTooltipOpen ? limitTooltipId : undefined
          }
          tabIndex={atTemplateLimit ? 0 : undefined}
          className={`relative inline-flex rounded-md focus-visible:outline-2 focus-visible:outline-action-primary ${atTemplateLimit ? 'cursor-not-allowed' : ''}`}
          onPointerEnter={() => setLimitTooltipOpen(true)}
          onPointerMove={() => {
            if (atTemplateLimit) setLimitTooltipOpen(true);
          }}
          onPointerLeave={(event) => {
            if (!event.currentTarget.contains(document.activeElement))
              setLimitTooltipOpen(false);
          }}
          onFocus={() => setLimitTooltipOpen(true)}
          onBlur={() => setLimitTooltipOpen(false)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') setLimitTooltipOpen(false);
          }}
        >
          <Button
            variant="primary"
            disabled={!canCreate}
            // 비활성 버튼이 포인터 이벤트를 삼키지 않도록 안내용 래퍼에서 처리한다.
            style={atTemplateLimit ? { pointerEvents: 'none' } : undefined}
            leadingIcon={<Plus aria-hidden="true" className="size-4" />}
            onClick={() => setNameModalOpen(true)}
          >
            템플릿 생성
          </Button>
          {atTemplateLimit && limitTooltipOpen && (
            <span
              id={limitTooltipId}
              role="tooltip"
              className="absolute right-0 top-full z-40 mt-1 w-max max-w-[calc(100vw-2rem)] rounded-sm border border-border-subtle bg-bg-surface px-2 py-1 text-caption-web text-text-primary shadow-sm"
            >
              템플릿은 최대 {TEMPLATE_LIMIT}개까지 등록할 수 있습니다.
            </span>
          )}
        </span>
      </header>

      {deletionNotice && (
        <p
          role="status"
          className="mb-4 text-body-sm-web text-status-success-fg"
        >
          {deletionNotice}
        </p>
      )}

      {loading || error ? (
        <div
          className="rounded-xl border border-border-subtle bg-bg-surface py-20 text-center text-body-sm-web text-text-secondary"
          role={error ? 'alert' : 'status'}
        >
          {error ?? '템플릿을 불러오는 중입니다.'}
        </div>
      ) : templates.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 @sm:grid-cols-2 @xl:grid-cols-3 @3xl:grid-cols-4 @5xl:grid-cols-5">
          {templates.map((template) => (
            <TemplatePreviewCard
              key={template.templateId}
              onDeleteRequest={(target) => {
                if (target.status !== 'DRAFT' || deletionLock.current) return;
                setDeletionError(null);
                setDeletionNotice('');
                setPendingDeletion(target);
              }}
              onActivationRequest={(template) => {
                setActivationError(null);
                setPendingActivationTemplate(template);
              }}
              onOpenTemplate={onOpenTemplate}
              template={template}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-border-subtle bg-bg-surface py-20 text-center text-body-sm-web text-text-secondary">
          조회된 템플릿이 없습니다
        </div>
      )}

      {nameModalOpen && (
        <TemplateNameModal
          onClose={() => setNameModalOpen(false)}
          onStart={(name) => {
            if (!canCreate) return;
            setNameModalOpen(false);
            onCreate(name);
          }}
        />
      )}
      <AdminModal
        title="템플릿 삭제"
        open={pendingDeletion !== null}
        onClose={closeDeletionModal}
      >
        <div className="flex flex-col gap-6">
          <p className="text-body-sm-web text-text-secondary">
            {pendingDeletion?.name} 템플릿을 삭제하시겠습니까? 모든 임시저장
            버전과 대화가 함께 삭제되며 복구할 수 없습니다.
          </p>
          {deletionError && (
            <p role="alert" className="text-caption-web text-status-danger-fg">
              {deletionError}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              disabled={deleting}
              onClick={closeDeletionModal}
            >
              취소
            </Button>
            <Button
              variant="danger"
              isLoading={deleting}
              onClick={() => void handleConfirmDeletion()}
            >
              삭제
            </Button>
          </div>
        </div>
      </AdminModal>

      <AdminModal
        onClose={closeActivationModal}
        open={pendingActivationTemplate !== null}
        title={`템플릿 ${isActivating ? '활성화' : '비활성화'}`}
      >
        <div className="flex flex-col gap-6">
          <p className="text-body-sm-web leading-6 text-text-secondary">
            &apos;{pendingActivationTemplate?.name}&apos; 템플릿을{' '}
            {isActivating ? '활성화' : '비활성화'}하시겠습니까?
            {isActivating
              ? ' 활성화하면 점주가 템플릿을 선택할 수 있습니다.'
              : ' 비활성화하면 점주에게 더 이상 노출되지 않습니다.'}
          </p>
          {activationError && (
            <p role="alert" className="text-caption-web text-status-danger-fg">
              {activationError}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button
              disabled={changingActive}
              onClick={closeActivationModal}
              variant="secondary"
            >
              취소
            </Button>
            <Button
              disabled={changingActive}
              onClick={() => void handleConfirmActivation()}
            >
              {isActivating ? '활성화' : '비활성화'}
            </Button>
          </div>
        </div>
      </AdminModal>
    </section>
  );
};
