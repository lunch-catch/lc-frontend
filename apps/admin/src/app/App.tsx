import { useState } from 'react';

import { useAdminAuth } from '@admin/auth/useAdminAuth';
import { useTemplateManagement } from '@admin/features/template/useTemplateManagement';
import { AdminLayout } from '@admin/layout/AdminLayout';
import { AdminAccountManagementPage } from '@admin/pages/AdminAccountManagementPage';
import { CampaignManagementPage } from '@admin/pages/CampaignManagementPage';
import { LoginPage } from '@admin/pages/LoginPage';
import { MemberManagementPage } from '@admin/pages/MemberManagementPage';
import { PointSettlementPage } from '@admin/pages/PointSettlementPage';
import { StoreApplicationsPage } from '@admin/pages/StoreApplicationsPage';
import { TemplateCreatePage } from '@admin/pages/TemplateCreatePage';
import { TemplateManagementPage } from '@admin/pages/TemplateManagementPage';

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
  const templateManagement = useTemplateManagement();
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
      onNavigate={(itemId) => {
        setActiveItemId(itemId);
        if (itemId === 'template') {
          templateManagement.returnToList();
        }
      }}
    >
      {activeItemId === 'merchant' ? (
        <StoreApplicationsPage />
      ) : activeItemId === 'account' ? (
        <AdminAccountManagementPage />
      ) : activeItemId === 'member' ? (
        <MemberManagementPage />
      ) : activeItemId === 'campaign' ? (
        <CampaignManagementPage />
      ) : activeItemId === 'settlement' ? (
        <PointSettlementPage />
      ) : activeItemId === 'template' ? (
        templateManagement.view === 'create' ? (
          <TemplateCreatePage
            draftTemplate={templateManagement.draftTemplate}
            onBack={templateManagement.returnToList}
            onSave={templateManagement.saveTemplate}
            onTemporarySave={templateManagement.saveTemporaryTemplate}
          />
        ) : (
          <TemplateManagementPage
            hasDraft={templateManagement.hasDraft}
            onCreate={templateManagement.openCreate}
            onEditDraft={templateManagement.openDraftEditor}
            onLoadDraft={templateManagement.openDraft}
            onTemplatesChange={templateManagement.updateTemplates}
            templates={templateManagement.templates}
          />
        )
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
