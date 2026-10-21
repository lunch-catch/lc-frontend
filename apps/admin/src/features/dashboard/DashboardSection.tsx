import type { ReactNode } from 'react';

interface DashboardSectionProps {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}

export const DashboardSection = ({
  title,
  action,
  children,
}: DashboardSectionProps) => (
  <section
    aria-label={title}
    className="min-w-0 rounded-xl border border-border-subtle bg-bg-surface p-4 sm:p-5"
  >
    <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
      <h3 className="text-h2-web font-semibold text-text-primary">{title}</h3>
      {action}
    </header>
    {children}
  </section>
);
