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
    <div className="relative h-dvh overflow-hidden bg-bg-page">
      <AdminSidebar
        activeItemId={activeItemId}
        onItemSelect={onNavigate}
        onLogout={onLogout}
      />
      <div className="ml-[72px] flex h-full min-w-0 flex-col">
        <main className="min-h-0 flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
};
