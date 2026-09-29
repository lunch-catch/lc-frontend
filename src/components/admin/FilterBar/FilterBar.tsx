import type { HTMLAttributes, ReactNode } from 'react';
import { RotateCcw } from 'lucide-react';

import { Button } from '../../shared/Button/Button';

export interface FilterBarProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  onReset?: () => void;
}

export function FilterBar({
  children,
  className,
  onReset,
  ...props
}: FilterBarProps) {
  return (
    <div
      className={[
        'flex min-h-16 flex-wrap items-center gap-3 rounded-lg border border-border-subtle bg-bg-page p-3',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      <div
        className="flex w-full flex-wrap items-center justify-end gap-3"
        style={{ gap: 'var(--space-3)' }}
      >
        {children}
        {onReset && (
          <Button
            leadingIcon={<RotateCcw aria-hidden="true" className="size-4" />}
            onClick={onReset}
            variant="tertiary"
          >
            초기화
          </Button>
        )}
      </div>
    </div>
  );
}
