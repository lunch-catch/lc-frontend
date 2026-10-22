import type { HTMLAttributes } from 'react';
import { RotateCw } from 'lucide-react';

export interface ErrorStateProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  onRetry?: () => void;
  retryDisabled?: boolean;
}

// 테이블과 카드가 같은 오류 안내와 재시도 아이콘을 사용한다.
export const ErrorState = ({
  title = '데이터를 불러오지 못했습니다',
  description = '잠시 후 다시 시도해 주세요.',
  onRetry,
  retryDisabled = false,
  className,
  ...props
}: ErrorStateProps) => (
  <div
    role="alert"
    className={[
      'flex flex-col items-center justify-center text-center',
      className,
    ]
      .filter(Boolean)
      .join(' ')}
    {...props}
  >
    <strong className="text-body-web font-medium text-status-danger-fg">
      {title}
    </strong>
    <span className="mt-1 text-caption-web text-text-secondary">
      {description}
    </span>
    {onRetry && (
      <button
        type="button"
        aria-label="다시 시도"
        title="다시 시도"
        disabled={retryDisabled}
        onClick={onRetry}
        className="mt-3 inline-flex size-9 items-center justify-center rounded-full border border-border-subtle bg-bg-surface text-text-secondary hover:bg-surface-subtle hover:text-action-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary disabled:cursor-not-allowed disabled:opacity-50"
      >
        <RotateCw aria-hidden="true" className="size-4" />
      </button>
    )}
  </div>
);
