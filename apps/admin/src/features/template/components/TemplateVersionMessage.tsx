interface TemplateVersionMessageProps {
  versionNumber: number;
  current: boolean;
  disabled: boolean;
  onSelect: (versionNumber: number) => void;
}

export const TemplateVersionMessage = ({
  versionNumber,
  current,
  disabled,
  onSelect,
}: TemplateVersionMessageProps) => (
  <button
    type="button"
    aria-current={current ? 'true' : undefined}
    disabled={disabled}
    onClick={() => onSelect(versionNumber)}
    className={`flex w-full items-center gap-2 rounded-md px-2 py-2 text-center text-caption-web transition-colors hover:bg-surface-brand hover:text-text-brand active:bg-action-primary/15 focus-visible:outline-2 focus-visible:outline-action-primary disabled:cursor-not-allowed disabled:opacity-50 ${current ? 'bg-surface-brand text-text-brand' : 'text-text-secondary'}`}
  >
    <span aria-hidden="true" className="h-px min-w-2 flex-1 bg-border-subtle" />
    <span className="min-w-0 truncate">
      버전 {versionNumber}이 생성되었습니다.
    </span>
    <span aria-hidden="true" className="h-px min-w-2 flex-1 bg-border-subtle" />
  </button>
);
