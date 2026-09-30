import type { HTMLAttributes, ReactNode } from 'react';
import { Button } from '@repo/ui';
import { RotateCcw } from 'lucide-react';

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
        'relative z-20 flex min-h-12 items-center gap-3 px-3 py-1',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      <div
        className="flex w-full items-center justify-start gap-3"
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
