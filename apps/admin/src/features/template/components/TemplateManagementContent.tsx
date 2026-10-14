import { useMemo, useRef, useState } from 'react';
import { Button, SearchField, SelectField } from '@repo/ui';
import { FilePenLine, Plus } from 'lucide-react';

import { AdminModal } from '@admin/components/AdminModal/AdminModal';
import { FilterBar } from '@admin/components/FilterBar/FilterBar';
import type { PosterTemplate } from '@admin/features/template/templateTypes';
import { getTemplateError } from '@admin/features/template/templateUtils';
import { useDebouncedSearch } from '@admin/hooks/useDebouncedSearch';

import { TemplateNameModal } from './TemplateNameModal';
import { TemplatePreviewCard } from './TemplatePreviewCard';

type TemplateSort = 'ACTIVE_FIRST' | 'INACTIVE_FIRST' | 'REGISTERED';

const activationOptions = [
  { label: '활성 여부 전체', value: 'ALL' },
  { label: '활성', value: 'ACTIVE' },
  { label: '비활성', value: 'INACTIVE' },
];
const statusOptions = [
  { label: '상태 전체', value: 'ALL' },
  { label: '임시저장 중', value: 'DRAFT' },
  { label: '게시됨', value: 'PUBLISHED' },
];
const sortOptions = [
  { label: '최신 등록순', value: 'REGISTERED' },
  { label: '활성 템플릿 우선', value: 'ACTIVE_FIRST' },
  { label: '비활성 템플릿 우선', value: 'INACTIVE_FIRST' },
];

export interface TemplateManagementContentProps {
  onCreate: (name: string) => void;
  onOpenTemplate: (template: PosterTemplate) => void;
  onLoadDraft: () => void;
  changeActive: (template: PosterTemplate) => Promise<void>;
  loading: boolean;
  error: string | null;
  hasDraft: boolean;
  templates: PosterTemplate[];
}

export const TemplateManagementContent = ({
  onCreate,
  onOpenTemplate,
  onLoadDraft,
  changeActive,
  loading,
  error,
  hasDraft,
  templates,
}: TemplateManagementContentProps) => {
  const [activation, setActivation] = useState('ALL');
  const [nameModalOpen, setNameModalOpen] = useState(false);
  const [activationError, setActivationError] = useState<string | null>(null);
  const [changingActive, setChangingActive] = useState(false);
  const activationLock = useRef(false);
  const [pendingActivationTemplate, setPendingActivationTemplate] =
    useState<PosterTemplate | null>(null);
  const [sort, setSort] = useState<TemplateSort>('REGISTERED');
  const [status, setStatus] = useState('ALL');
  const { draftKeyword, keyword, setDraftKeyword } = useDebouncedSearch();

  const filteredTemplates = useMemo(() => {
    const query = keyword.trim().toLowerCase();
    const result = templates.filter((template) => {
      const matchesActivation =
        activation === 'ALL' ||
        (activation === 'ACTIVE' ? template.active : !template.active);
      const matchesStatus = status === 'ALL' || template.status === status;
      const matchesKeyword =
        !query ||
        [String(template.templateId), template.name].some((value) =>
          value.toLowerCase().includes(query),
        );

      return matchesActivation && matchesKeyword && matchesStatus;
    });

    return [...result].sort((first, second) => {
      if (sort === 'ACTIVE_FIRST') {
        return Number(second.active) - Number(first.active);
      }
      if (sort === 'INACTIVE_FIRST') {
        return Number(first.active) - Number(second.active);
      }

      return second.createdAt.localeCompare(first.createdAt);
    });
  }, [activation, keyword, sort, status, templates]);

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
  const isActivating = pendingActivationTemplate?.active === false;

  return (
    <section className="flex flex-col">
      <header className="mb-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-display-web font-semibold text-text-primary">
            템플릿 관리
          </h2>
          <p className="mt-2 text-body-sm-web text-text-secondary">
            템플릿을 미리보기로 확인하고 점주 노출 여부를 관리합니다.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            disabled={!hasDraft}
            leadingIcon={<FilePenLine aria-hidden="true" className="size-4" />}
            onClick={onLoadDraft}
            variant="secondary"
          >
            임시저장 불러오기
          </Button>
          <Button
            leadingIcon={<Plus aria-hidden="true" className="size-4" />}
            onClick={() => setNameModalOpen(true)}
          >
            템플릿 생성
          </Button>
        </div>
      </header>

      <FilterBar className="mb-4 shrink-0">
        <SearchField
          onChange={(event) => setDraftKeyword(event.target.value)}
          value={draftKeyword}
        />
        <SelectField
          fitContent
          onValueChange={(value) => {
            setStatus(value);
          }}
          options={statusOptions}
          value={status}
        />
        <SelectField
          fitContent
          onValueChange={(value) => {
            setActivation(value);
          }}
          options={activationOptions}
          value={activation}
        />
        <SelectField
          fitContent
          onValueChange={(value) => {
            setSort(value as TemplateSort);
          }}
          options={sortOptions}
          value={sort}
        />
      </FilterBar>

      {loading || error ? (
        <div
          className="rounded-xl border border-border-subtle bg-bg-surface py-20 text-center text-body-sm-web text-text-secondary"
          role={error ? 'alert' : 'status'}
        >
          {error ?? '템플릿을 불러오는 중입니다.'}
        </div>
      ) : filteredTemplates.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-4">
          {filteredTemplates.map((template) => (
            <TemplatePreviewCard
              key={template.templateId}
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
            setNameModalOpen(false);
            onCreate(name);
          }}
        />
      )}
      <AdminModal
        onClose={() => {
          if (!changingActive) setPendingActivationTemplate(null);
        }}
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
              onClick={() => setPendingActivationTemplate(null)}
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
