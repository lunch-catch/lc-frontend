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

const templateQuery = {
  keyword: queryText(),
  activation: queryChoice(['ALL', 'ACTIVE', 'INACTIVE'] as const, 'ALL'),
  status: queryChoice(['ALL', 'DRAFT', 'PUBLISHED'] as const, 'ALL'),
  sort: queryChoice(
    ['ACTIVE_FIRST', 'INACTIVE_FIRST', 'REGISTERED'] as const,
    'REGISTERED',
  ),
};

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
  changeActive: (template: PosterTemplate) => Promise<void>;
  loading: boolean;
  error: string | null;
  templates: PosterTemplate[];
}

export const TemplateManagementContent = ({
  onCreate,
  onOpenTemplate,
  changeActive,
  loading,
  error,
  templates,
}: TemplateManagementContentProps) => {
  const { filters, updateFilters } = useUrlFilters('templates.', templateQuery);
  const { activation, status, sort } = filters;
  const [nameModalOpen, setNameModalOpen] = useState(false);
  const [limitTooltipOpen, setLimitTooltipOpen] = useState(false);
  const limitTooltipId = useId();
  // 검색·상태 필터와 무관하게 서버가 반환한 전체 템플릿 수로 생성 한도를 판단한다.
  const atTemplateLimit = templates.length >= TEMPLATE_LIMIT;
  const canCreate = !loading && !error && !atTemplateLimit;
  const [activationError, setActivationError] = useState<string | null>(null);
  const [changingActive, setChangingActive] = useState(false);
  const activationLock = useRef(false);
  const [pendingActivationTemplate, setPendingActivationTemplate] =
    useState<PosterTemplate | null>(null);
  const { draftKeyword, keyword, setDraftKeyword } = useUrlSearch(
    filters.keyword,
    (keyword) => updateFilters({ keyword }),
  );

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

      <FilterBar className="mb-4 shrink-0">
        <SearchField
          onChange={(event) => setDraftKeyword(event.target.value)}
          value={draftKeyword}
        />
        <SelectField
          fitContent
          onValueChange={(value) => {
            updateFilters({ status: value as typeof status });
          }}
          options={statusOptions}
          value={status}
        />
        <SelectField
          fitContent
          onValueChange={(value) => {
            updateFilters({ activation: value as typeof activation });
          }}
          options={activationOptions}
          value={activation}
        />
        <SelectField
          fitContent
          onValueChange={(value) => {
            updateFilters({ sort: value as typeof sort });
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
        <div className="grid grid-cols-1 gap-4 @sm:grid-cols-2 @xl:grid-cols-3 @3xl:grid-cols-4 @5xl:grid-cols-5">
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
            if (!canCreate) return;
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
