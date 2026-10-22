import type { ReactNode } from 'react';

interface DashboardSectionProps {
  title: string;
  /** 그래프 해석에 필요한 설명은 카드 제목 바로 아래에 표시한다. */
  description?: ReactNode;
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
    className="min-w-0 rounded-xl border border-border-subtle bg-bg-surface p-4 sm:p-5"
  >
    <header className="mb-3 flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0 flex-1 space-y-1">
        <h3 className="text-h2-web font-semibold text-text-primary">{title}</h3>
        {description && (
          <p className="text-caption-web text-text-secondary">{description}</p>
        )}
      </div>
      {action}
    </header>
    {children}
  </section>
);
