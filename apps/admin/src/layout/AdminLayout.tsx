import type { ReactNode } from 'react';

import { AdminSidebar } from '@admin/components/AdminSidebar/AdminSidebar';

export interface AdminLayoutProps {
  activeItemId: string;
  children: ReactNode;
  onLogout: () => void;
  onNavigate: (itemId: string) => void;
}

export const AdminLayout = ({
  activeItemId,
  children,
  onLogout,
  onNavigate,
}: AdminLayoutProps) => {
  return (
    <div className="relative min-h-screen bg-surface-subtle">
      <AdminSidebar
        activeItemId={activeItemId}
        onItemSelect={onNavigate}
        onLogout={onLogout}
      />
      <div className="ml-[72px] flex min-h-screen min-w-0 flex-col">
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
};
