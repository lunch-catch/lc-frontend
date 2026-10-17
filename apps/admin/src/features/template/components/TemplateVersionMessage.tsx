import type { TemplateVersionAvailability } from '@admin/features/template/templateTypes';

interface TemplateVersionMessageProps {
  versionNumber: number;
  current: boolean;
  disabled: boolean;
  availability: TemplateVersionAvailability;
  onSelect: (versionNumber: number) => void;
}

export const TemplateVersionMessage = ({
  versionNumber,
  current,
  disabled,
  availability,
  onSelect,
}: TemplateVersionMessageProps) => (
  <button
    type="button"
    aria-current={current ? 'true' : undefined}
    disabled={disabled || availability !== 'available'}
    title={
      availability === 'deleted'
        ? '삭제되어 더 이상 사용할 수 없는 버전입니다.'
        : availability === 'unknown'
          ? '버전 이력을 확인한 후 선택할 수 있습니다.'
          : undefined
    }
    onClick={() => onSelect(versionNumber)}
    className={`group flex w-full items-center gap-2 rounded-md px-2 py-2 text-center text-caption-web transition-colors enabled:hover:text-text-brand focus-visible:outline-2 focus-visible:outline-action-primary disabled:cursor-not-allowed disabled:opacity-50 ${current ? 'font-semibold text-text-brand' : 'text-text-secondary'}`}
  >
    <span
      aria-hidden="true"
      className={`h-px min-w-2 flex-1 transition-colors group-[:enabled:hover]:bg-action-primary ${current ? 'bg-action-primary' : 'bg-border-subtle'}`}
    />
    <span className="min-w-0 truncate">
      버전 {versionNumber} · {availability === 'available' && '임시저장'}
      {availability === 'deleted' && '삭제됨'}
      {availability === 'unknown' && '확인 필요'}
    </span>
    <span
      aria-hidden="true"
      className={`h-px min-w-2 flex-1 transition-colors group-[:enabled:hover]:bg-action-primary ${current ? 'bg-action-primary' : 'bg-border-subtle'}`}
    />
  </button>
);
