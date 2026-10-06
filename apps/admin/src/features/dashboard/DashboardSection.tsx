import type { ReactNode } from 'react';

interface DashboardSectionProps {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}

export const DashboardSection = ({
  title,
  description,
  action,
  children,
}: DashboardSectionProps) => (
  <section
    aria-label={title}
    className="min-w-0 rounded-xl border border-border-subtle bg-bg-surface p-6"
  >
    <header className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h3 className="text-h2-web font-semibold text-text-primary">{title}</h3>
        {description && (
          <p className="mt-2 text-caption-web text-text-secondary">
            {description}
          </p>
        )}
      </div>
      {action}
    </header>
    {children}
  </section>
);
