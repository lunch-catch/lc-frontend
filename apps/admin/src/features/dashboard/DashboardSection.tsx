import type { ReactNode } from 'react';

interface DashboardSectionProps {
  title: string;
  className?: string;
  /** 설명 줄 수가 달라도 같은 행의 그래프 시작 위치를 맞출 때 사용한다. */
  headerClassName?: string;
  /** 그래프 해석에 필요한 설명은 카드 제목 바로 아래에 표시한다. */
  description?: ReactNode;
  action?: ReactNode;
  featured?: boolean;
  children: ReactNode;
}

export const DashboardSection = ({
  title,
  className,
  headerClassName,
  description,
  action,
  featured = false,
  children,
}: DashboardSectionProps) => (
  <section
    aria-label={title}
    className={`relative min-w-0 rounded-2xl border border-border-subtle bg-bg-surface p-4 ${featured ? 'sm:p-6' : ''} ${className ?? ''}`}
  >
    <header
      className={`mb-6 flex flex-col items-start justify-between gap-3 sm:flex-row ${headerClassName ?? ''}`}
    >
      <div className="min-w-0 flex-1 space-y-1">
        <h3 className="text-h2-web font-semibold text-text-primary">{title}</h3>
        {description && (
          <p className="text-caption-web leading-5 text-text-secondary">
            {description}
          </p>
        )}
      </div>
      {action}
    </header>
    {children}
  </section>
);
