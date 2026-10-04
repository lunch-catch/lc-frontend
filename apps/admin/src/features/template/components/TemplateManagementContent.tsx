import { useMemo, useState } from 'react';
import { Button, SearchField, SelectField } from '@repo/ui';
import { FilePenLine, Plus } from 'lucide-react';

import { AdminModal } from '@admin/components/AdminModal/AdminModal';
import { FilterBar } from '@admin/components/FilterBar/FilterBar';
import { FilterResetButton } from '@admin/components/FilterResetButton/FilterResetButton';
import { Pagination } from '@admin/components/Pagination/Pagination';
import type { PosterTemplate } from '@admin/features/template/templateTypes';
import { useDebouncedSearch } from '@admin/hooks/useDebouncedSearch';

import { TemplatePreviewCard } from './TemplatePreviewCard';

type TemplateSort =
  'ACTIVE_FIRST' | 'INACTIVE_FIRST' | 'POPULAR' | 'REGISTERED';

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
  { label: '인기순', value: 'POPULAR' },
  { label: '활성 템플릿 우선', value: 'ACTIVE_FIRST' },
  { label: '비활성 템플릿 우선', value: 'INACTIVE_FIRST' },
];

export interface TemplateManagementContentProps {
  onCreate: () => void;
  onEditDraft: (template: PosterTemplate) => void;
  onLoadDraft: () => void;
  onTemplatesChange: (templates: PosterTemplate[]) => void;
  hasDraft: boolean;
  templates: PosterTemplate[];
}

export const TemplateManagementContent = ({
  onCreate,
  onEditDraft,
  onLoadDraft,
  onTemplatesChange,
  hasDraft,
  templates,
}: TemplateManagementContentProps) => {
  const [activation, setActivation] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [pendingActivationTemplate, setPendingActivationTemplate] =
    useState<PosterTemplate | null>(null);
  const [pageSize, setPageSize] = useState(12);
  const [sort, setSort] = useState<TemplateSort>('REGISTERED');
  const [status, setStatus] = useState('ALL');
  const { draftKeyword, keyword, resetSearch, setDraftKeyword } =
    useDebouncedSearch({ onCommit: () => setCurrentPage(1) });

  const filteredTemplates = useMemo(() => {
    const query = keyword.trim().toLowerCase();
    const result = templates.filter((template) => {
      const matchesActivation =
        activation === 'ALL' ||
        (activation === 'ACTIVE' ? template.isActive : !template.isActive);
      const matchesStatus = status === 'ALL' || template.status === status;
      const matchesKeyword =
        !query ||
        [template.id, template.name].some((value) =>
          value.toLowerCase().includes(query),
        );

      return matchesActivation && matchesKeyword && matchesStatus;
    });

    return [...result].sort((first, second) => {
      if (sort === 'POPULAR') return second.usageCount - first.usageCount;
      if (sort === 'ACTIVE_FIRST') {
        return Number(second.isActive) - Number(first.isActive);
      }
      if (sort === 'INACTIVE_FIRST') {
        return Number(first.isActive) - Number(second.isActive);
      }

      return second.createdAt.localeCompare(first.createdAt);
    });
  }, [activation, keyword, sort, status, templates]);

  const totalPages = Math.ceil(filteredTemplates.length / pageSize);
  const visibleTemplates = filteredTemplates.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const handleReset = () => {
    resetSearch();
    setActivation('ALL');
    setCurrentPage(1);
    setSort('REGISTERED');
    setStatus('ALL');
  };

  const handleConfirmActivation = () => {
    if (!pendingActivationTemplate) return;

    onTemplatesChange(
      templates.map((template) =>
        template.id === pendingActivationTemplate.id
          ? {
              ...template,
              isActive: !template.isActive,
              updatedAt: '2026-10-02 10:00',
              updatedBy: 'ADM-001',
            }
          : template,
      ),
    );
    setPendingActivationTemplate(null);
  };

  const isActivating = pendingActivationTemplate?.isActive === false;

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
            onClick={onCreate}
          >
            템플릿 생성
          </Button>
        </div>
      </header>

      <FilterBar className="mb-4 shrink-0">
        <div className="flex w-full flex-wrap items-center justify-between gap-3">
          <p className="text-body-sm-web text-text-secondary">
            총 {filteredTemplates.length}개 템플릿
          </p>
          <div className="flex flex-wrap items-center justify-end gap-3">
            <SearchField
              onChange={(event) => setDraftKeyword(event.target.value)}
              value={draftKeyword}
            />
            <SelectField
              fitContent
              onValueChange={(value) => {
                setCurrentPage(1);
                setStatus(value);
              }}
              options={statusOptions}
              value={status}
            />
            <SelectField
              fitContent
              onValueChange={(value) => {
                setActivation(value);
                setCurrentPage(1);
              }}
              options={activationOptions}
              value={activation}
            />
            <SelectField
              fitContent
              onValueChange={(value) => {
                setCurrentPage(1);
                setSort(value as TemplateSort);
              }}
              options={sortOptions}
              value={sort}
            />
            <FilterResetButton onClick={handleReset} />
          </div>
        </div>
      </FilterBar>

      {visibleTemplates.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-4">
          {visibleTemplates.map((template) => (
            <TemplatePreviewCard
              key={template.id}
              onActivationRequest={setPendingActivationTemplate}
              onEditDraft={onEditDraft}
              template={template}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-border-subtle bg-bg-surface py-20 text-center text-body-sm-web text-text-secondary">
          조회된 템플릿이 없습니다
        </div>
      )}

      {filteredTemplates.length > 0 && (
        <div className="mt-4">
          <Pagination
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            onPageSizeChange={(value) => {
              setCurrentPage(1);
              setPageSize(value);
            }}
            pageSize={pageSize}
            pageSizeOptions={[12, 24, 48]}
            totalCount={filteredTemplates.length}
            totalPages={totalPages}
          />
        </div>
      )}

      <AdminModal
        onClose={() => setPendingActivationTemplate(null)}
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
          <div className="flex justify-end gap-2">
            <Button
              onClick={() => setPendingActivationTemplate(null)}
              variant="secondary"
            >
              취소
            </Button>
            <Button onClick={handleConfirmActivation}>
              {isActivating ? '활성화' : '비활성화'}
            </Button>
          </div>
        </div>
      </AdminModal>
    </section>
  );
};
