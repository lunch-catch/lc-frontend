import { Bell } from 'lucide-react';

export interface AdminHeaderProps {
  pageTitle: string;
}

export const AdminHeader = ({ pageTitle }: AdminHeaderProps) => {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border-subtle bg-bg-surface px-6">
      <h1 className="text-title-sm-web font-semibold text-text-primary">
        {pageTitle}
      </h1>
      <div className="flex items-center">
        <button
          aria-label="알림"
          className="rounded-md p-2 text-text-secondary transition-colors hover:bg-surface-subtle hover:text-action-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary"
          type="button"
        >
          <Bell aria-hidden="true" className="size-5" />
        </button>
      </div>
    </header>
  );
};
