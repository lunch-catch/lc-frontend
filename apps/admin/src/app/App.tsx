import { useState } from 'react';

import { useAdminAuth } from '@admin/auth/useAdminAuth';
import {
  initialPosterTemplates,
  type PosterTemplate,
} from '@admin/features/template/templateData';
import { AdminLayout } from '@admin/layout/AdminLayout';
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
  const [templateView, setTemplateView] = useState<'create' | 'list'>('list');
  const [templates, setTemplates] = useState<PosterTemplate[]>(
    initialPosterTemplates,
  );
  const [draftTemplates, setDraftTemplates] = useState<PosterTemplate[]>([]);
  const [editingDraftId, setEditingDraftId] = useState<string | null>(null);
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
          setEditingDraftId(null);
          setTemplateView('list');
        }
      }}
    >
      {activeItemId === 'merchant' ? (
        <StoreApplicationsPage />
      ) : activeItemId === 'member' ? (
        <MemberManagementPage />
      ) : activeItemId === 'campaign' ? (
        <CampaignManagementPage />
      ) : activeItemId === 'settlement' ? (
        <PointSettlementPage />
      ) : activeItemId === 'template' ? (
        templateView === 'create' ? (
          <TemplateCreatePage
            draftTemplate={
              draftTemplates.find(
                (template) => template.id === editingDraftId,
              ) ?? null
            }
            onBack={() => {
              setEditingDraftId(null);
              setTemplateView('list');
            }}
            onSave={(template) => {
              const isNewTemplate = template.id.startsWith('TPL-DRAFT');
              if (
                isNewTemplate &&
                templates.length + draftTemplates.length >= 10
              ) {
                return false;
              }

              setTemplates((current) => [
                {
                  ...template,
                  id: template.id.startsWith('TPL-DRAFT')
                    ? `TPL-${String(current.length + 1).padStart(4, '0')}`
                    : template.id,
                },
                ...current.filter((item) => item.id !== template.id),
              ]);
              setDraftTemplates((current) =>
                current.filter((item) => item.id !== template.id),
              );
              setEditingDraftId(null);
              setTemplateView('list');
              return true;
            }}
            onTemporarySave={(template) => {
              const isNewTemplate = !draftTemplates.some(
                (item) => item.id === template.id,
              );
              if (
                isNewTemplate &&
                templates.length + draftTemplates.length >= 10
              ) {
                return false;
              }

              setDraftTemplates((current) => {
                const previous = current.filter(
                  (item) => item.id !== template.id,
                );
                return [template, ...previous];
              });
              setEditingDraftId(null);
              setTemplateView('list');
              return true;
            }}
          />
        ) : (
          <TemplateManagementPage
            hasDraft={draftTemplates.length > 0}
            onCreate={() => {
              setEditingDraftId(null);
              setTemplateView('create');
            }}
            onLoadDraft={() => {
              setEditingDraftId(draftTemplates[0]?.id ?? null);
              setTemplateView('create');
            }}
            onEditDraft={(template) => {
              setEditingDraftId(template.id);
              setTemplateView('create');
            }}
            onTemplatesChange={setTemplates}
            templates={[...draftTemplates, ...templates]}
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
