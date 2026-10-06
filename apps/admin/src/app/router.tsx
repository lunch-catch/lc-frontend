import { createBrowserRouter, Navigate } from 'react-router';

import { RequireAdminAuth } from '@admin/auth/RequireAdminAuth';
import { AdminLayout } from '@admin/layout/AdminLayout';
import { AdminAccountManagementPage } from '@admin/pages/AdminAccountManagementPage';
import { CampaignManagementPage } from '@admin/pages/CampaignManagementPage';
import { FraudManagementPage } from '@admin/pages/FraudManagementPage';
import { LoginPage } from '@admin/pages/LoginPage';
import { MemberManagementPage } from '@admin/pages/MemberManagementPage';
import { PendingManagementPage } from '@admin/pages/PendingManagementPage';
import { PointSettlementPage } from '@admin/pages/PointSettlementPage';
import { StoreApplicationsPage } from '@admin/pages/StoreApplicationsPage';
import { TemplateCreatePage } from '@admin/pages/TemplateCreatePage';
import { TemplateManagementPage } from '@admin/pages/TemplateManagementPage';

// 로그인 화면만 공개하고 모든 관리자 메뉴는 인증 가드와 공통 레이아웃 아래에 둔다.
export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: <RequireAdminAuth />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { index: true, element: <Navigate replace to="/dashboard" /> },
          {
            path: '/dashboard',
            element: <PendingManagementPage title="대시보드" />,
          },
          { path: '/campaigns', element: <CampaignManagementPage /> },
          { path: '/templates', element: <TemplateManagementPage /> },
          { path: '/templates/new', element: <TemplateCreatePage /> },
          {
            path: '/templates/drafts/:templateId/edit',
            element: <TemplateCreatePage />,
          },
          { path: '/settlements', element: <PointSettlementPage /> },
          { path: '/store-applications', element: <StoreApplicationsPage /> },
          { path: '/members', element: <MemberManagementPage /> },
          { path: '/fraud', element: <FraudManagementPage /> },
          {
            path: '/reviews',
            element: <PendingManagementPage title="심사 관리" />,
          },
          { path: '/admin-accounts', element: <AdminAccountManagementPage /> },
          // 정의되지 않은 주소가 빈 화면으로 남지 않도록 기본 메뉴로 보낸다.
          { path: '*', element: <Navigate replace to="/dashboard" /> },
        ],
      },
    ],
  },
]);
