import type { ReactNode } from 'react';
import { StatusBadge } from '@repo/ui';

interface DashboardSectionProps {
  title: string;
  example?: boolean;
  action?: ReactNode;
  children: ReactNode;
}

export const DashboardSection = ({
  title,
  action,
  example,
  children,
}: DashboardSectionProps) => (
  <section
    aria-label={title}
    className="min-w-0 rounded-xl border border-border-subtle bg-bg-surface p-4 sm:p-5"
  >
    <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
      <h3 className="text-h2-web font-semibold text-text-primary">
        {title}
        {example && (
          <StatusBadge variant="neutral" className="ml-2">
            예시 데이터
          </StatusBadge>
        )}
      </h3>
      {action}
    </header>
    {children}
  </section>
);
