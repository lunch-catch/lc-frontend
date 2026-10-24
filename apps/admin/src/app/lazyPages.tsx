import { lazy } from 'react';

import {
  loadAdminAccountManagementPage,
  loadCampaignManagementPage,
  loadDashboardPage,
  loadFraudManagementPage,
  loadMemberManagementPage,
  loadPointSettlementPage,
  loadTemplateCreatePage,
  loadTemplateManagementPage,
} from './pageLoaders';

// lazy 정의는 렌더 밖에서 유지하고 생성 → 초안 주소 변경에도 같은 컴포넌트를 사용한다.
export const DashboardPage = lazy(loadDashboardPage);
export const CampaignManagementPage = lazy(loadCampaignManagementPage);
export const TemplateManagementPage = lazy(loadTemplateManagementPage);
export const TemplateCreatePage = lazy(loadTemplateCreatePage);
export const PointSettlementPage = lazy(loadPointSettlementPage);
export const MemberManagementPage = lazy(loadMemberManagementPage);
export const FraudManagementPage = lazy(loadFraudManagementPage);
export const AdminAccountManagementPage = lazy(loadAdminAccountManagementPage);
