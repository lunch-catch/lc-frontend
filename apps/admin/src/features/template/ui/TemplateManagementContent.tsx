import { useId, useMemo, useRef, useState } from 'react';
import { Button, SearchField, SelectField } from '@repo/ui';
import { Plus } from 'lucide-react';

import { queryChoice, queryText } from '@admin/hooks/urlQuery';
import { useUrlFilters } from '@admin/hooks/useUrlFilters';
import { useUrlSearch } from '@admin/hooks/useUrlSearch';
import { AdminModal } from '@admin/ui/AdminModal/AdminModal';
import { FilterBar } from '@admin/ui/FilterBar/FilterBar';

import type { PosterTemplate } from '../templateTypes';
import { getTemplateError, TEMPLATE_LIMIT } from '../templateUtils';
import { TemplateNameModal } from './TemplateNameModal';
import { TemplatePreviewCard } from './TemplatePreviewCard';

export interface TemplateManagementContentProps {
  onCreate: (name: string) => void;
  onOpenTemplate: (template: PosterTemplate) => void;
  changeActive: (template: PosterTemplate) => Promise<void>;
  rename: (template: PosterTemplate, name: string) => Promise<void>;
  removeTemplate: (template: PosterTemplate) => Promise<void>;
  loading: boolean;
  error: string | null;
  templates: PosterTemplate[];
}

const templateQuery = {
  keyword: queryText(),
  status: queryChoice(['ALL', 'DRAFT', 'PUBLISHED'] as const, 'ALL'),
  sort: queryChoice(['LATEST', 'NAME'] as const, 'LATEST'),
};
// 한글·영문 이름을 비교하고 이름 속 숫자는 2, 10처럼 숫자 크기순으로 정렬한다.
const nameCollator = new Intl.Collator('ko-KR', {
  numeric: true,
  sensitivity: 'base',
});

export const TemplateManagementContent = ({
  onCreate,
  onOpenTemplate,
  changeActive,
  rename,
  removeTemplate,
  loading,
  error,
  templates,
}: TemplateManagementContentProps) => {
  const { filters, updateFilters } = useUrlFilters('templates.', templateQuery);
  const search = useUrlSearch(filters.keyword, (keyword) =>
    updateFilters({ keyword }),
  );
  // 전체 목록은 유지한 채 표시할 카드만 골라 생성 한도·삭제 후 갱신에 영향을 주지 않는다.
  const visibleTemplates = useMemo(() => {
    const keyword = search.keyword.trim().toLocaleLowerCase('ko-KR');
    const filtered = templates.filter(
      (template) =>
        (filters.status === 'ALL' || template.status === filters.status) &&
        (!keyword ||
          template.name.toLocaleLowerCase('ko-KR').includes(keyword)),
    );
    // 최신 등록순은 서버 응답 순서를 보존하고, 이름순만 복사된 배열에서 정렬한다.
    return filters.sort === 'NAME'
      ? filtered.sort((a, b) => nameCollator.compare(a.name, b.name))
      : filtered;
  }, [templates, filters.status, filters.sort, search.keyword]);
  const [nameModalOpen, setNameModalOpen] = useState(false);
  const [renamingTemplate, setRenamingTemplate] =
    useState<PosterTemplate | null>(null);
  const [limitTooltipOpen, setLimitTooltipOpen] = useState(false);
  const limitTooltipId = useId();
  // 검색 결과 개수가 아니라 필터 없는 전체 응답으로 생성 한도를 판단한다.
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

      <FilterBar className="mb-4">
        <SearchField
          aria-label="템플릿명 검색"
          placeholder="템플릿명 검색"
          value={search.draftKeyword}
          onChange={(event) => search.setDraftKeyword(event.target.value)}
        />
        <SelectField
          aria-label="템플릿 상태"
          fitContent
          value={filters.status}
          options={[
            { label: '상태 전체', value: 'ALL' },
            { label: '임시저장', value: 'DRAFT' },
            { label: '게시됨', value: 'PUBLISHED' },
          ]}
          onValueChange={(status) => {
            if (
              status === 'ALL' ||
              status === 'DRAFT' ||
              status === 'PUBLISHED'
            )
              updateFilters({ status });
          }}
        />
        <SelectField
          aria-label="템플릿 정렬"
          fitContent
          value={filters.sort}
          options={[
            { label: '최신 등록순', value: 'LATEST' },
            { label: '이름순', value: 'NAME' },
          ]}
          onValueChange={(sort) => {
            if (sort === 'LATEST' || sort === 'NAME') updateFilters({ sort });
          }}
        />
      </FilterBar>

      {loading || error ? (
        <div
          className="rounded-xl border border-border-subtle bg-bg-surface py-20 text-center text-body-sm-web text-text-secondary"
          role={error ? 'alert' : 'status'}
        >
          {error ?? '템플릿을 불러오는 중입니다.'}
        </div>
      ) : visibleTemplates.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 @sm:grid-cols-2 @xl:grid-cols-3 @3xl:grid-cols-4 @5xl:grid-cols-5">
          {visibleTemplates.map((template) => (
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
              onRenameRequest={setRenamingTemplate}
              onOpenTemplate={onOpenTemplate}
              template={template}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-border-subtle bg-bg-surface py-20 text-center text-body-sm-web text-text-secondary">
          {search.keyword.trim() || filters.status !== 'ALL'
            ? '조건에 맞는 템플릿이 없습니다.'
            : '조회된 템플릿이 없습니다.'}
        </div>
      )}

      {renamingTemplate && (
        <TemplateNameModal
          initialName={renamingTemplate.name}
          onClose={() => setRenamingTemplate(null)}
          onStart={async (name) => {
            await rename(renamingTemplate, name);
            setRenamingTemplate(null);
          }}
        />
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
