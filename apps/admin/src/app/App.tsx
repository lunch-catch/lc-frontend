import { useState } from 'react';

import { useAdminAuth } from '@admin/auth/useAdminAuth';
import { AdminLayout } from '@admin/layout/AdminLayout';
import { CampaignManagementPage } from '@admin/pages/CampaignManagementPage';
import { LoginPage } from '@admin/pages/LoginPage';
import { MemberManagementPage } from '@admin/pages/MemberManagementPage';
import { StoreApplicationsPage } from '@admin/pages/StoreApplicationsPage';

const pageTitles: Record<string, string> = {
  account: '계정 관리',
  campaign: '캠페인 관리',
  dashboard: '대시보드',
  fraud: '부정 관리',
  member: '회원 관리',
  merchant: '입점 관리',
  review: '심사 관리',
  settlement: '포인트/정산 관리',
  template: '템플릿 관리',
};

const App = () => {
  const [activeItemId, setActiveItemId] = useState('dashboard');
  const { isAuthenticated, login, logout } = useAdminAuth();

  if (!isAuthenticated) {
    return (
      <LoginPage
        onLogin={(loginId, password) => login({ loginId, password })}
      />
    );
  }

  const pageTitle = pageTitles[activeItemId] ?? '관리자';

  return (
    <AdminLayout
      activeItemId={activeItemId}
      onLogout={logout}
      onNavigate={setActiveItemId}
    >
      {activeItemId === 'merchant' ? (
        <StoreApplicationsPage />
      ) : activeItemId === 'member' ? (
        <MemberManagementPage />
      ) : activeItemId === 'campaign' ? (
        <CampaignManagementPage />
      ) : (
        <section className="rounded-xl border border-border-subtle bg-bg-surface p-6">
          <h2 className="text-title-sm-web font-semibold text-text-primary">
            {pageTitle}
          </h2>
          <p className="mt-2 text-body-sm-web text-text-secondary">
            화면 구현을 위한 관리자 공통 레이아웃입니다.
          </p>
        </section>
      )}
    </AdminLayout>
  );
};

export default App;
